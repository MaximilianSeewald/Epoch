#!/usr/bin/env bash
set -euo pipefail

: "${RUNNER_TEMP:?RUNNER_TEMP is required}"
: "${GITHUB_WORKSPACE:?GITHUB_WORKSPACE is required}"
: "${STEAM_USERNAME:?STEAM_USERNAME is required}"
: "${STEAMCMD_CONFIG_VDF:?STEAMCMD_CONFIG_VDF is required}"
: "${STEAM_WORKSHOP_ID:?STEAM_WORKSHOP_ID is required}"
: "${RELEASE_VERSION:?RELEASE_VERSION is required}"
: "${COMMIT_SHA:?COMMIT_SHA is required}"

steam_home="$RUNNER_TEMP/steam-home"
steam_dir="$steam_home/Steam"
archive="$RUNNER_TEMP/steamcmd.tar.gz"
vdf="$RUNNER_TEMP/epoch-workshop.vdf"
config_path="$steam_dir/config/config.vdf"
package="$RUNNER_TEMP/epoch-mod-package"

cleanup() { rm -rf -- "$steam_home" "$archive" "$vdf"; }
trap cleanup EXIT
mkdir -p "$steam_dir"
export HOME="$steam_home"
test -s "$package/descriptor.mod" || { echo 'Validated mod package is missing.' >&2; exit 1; }

sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install -y lib32gcc-s1 lib32stdc++6
curl --fail --silent --show-error --location https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz -o "$archive"
tar -xzf "$archive" -C "$steam_dir"
cd "$steam_dir"

# Bootstrap once without the saved session to allow self-update.
set +e
init_output="$(./steamcmd.sh +quit 2>&1)"
init_status=$?
set -e
unset init_output
if [[ "$init_status" -ne 0 ]]; then
  echo 'SteamCMD initialization failed; raw output suppressed.' >&2
  exit 1
fi

mkdir -p "$(dirname "$config_path")"
if ! printf '%s' "$STEAMCMD_CONFIG_VDF" | base64 --decode 2>/dev/null > "$config_path" || [[ ! -s "$config_path" ]]; then
  echo 'SteamCMD session restoration failed; output suppressed.' >&2
  exit 1
fi
chmod 600 "$config_path"
test -r "$config_path" || { echo 'SteamCMD session is not readable.' >&2; exit 1; }

cat > "$vdf" <<VDF
"workshopitem"
{
  "appid" "281990"
  "publishedfileid" "$STEAM_WORKSHOP_ID"
  "contentfolder" "$package"
  "changenote" "EPOCH $RELEASE_VERSION | commit $COMMIT_SHA"
}
VDF
chmod 600 "$vdf"

# Match the proven manual command: authenticate and upload in ONE SteamCMD
# invocation. Do not reject it based on an unrelated login-text parser.
set +e
output="$(timeout --kill-after=15s 300s ./steamcmd.sh +login "$STEAM_USERNAME" +workshop_build_item "$vdf" +quit 2>&1)"
status=$?
set -e
set +e
category="$(printf '%s' "$output" | node "$GITHUB_WORKSPACE/scripts/steam_failure_classification.cjs" upload "$status" "$STEAM_WORKSHOP_ID" "$vdf" 2>/dev/null)"
diagnose_status=$?
set -e
unset output
if [[ "$diagnose_status" -ne 0 || "$category" != OK ]]; then
  [[ -n "$category" ]] || category=STEAM_UNKNOWN_ERROR
  echo "SteamCMD stage=UPLOAD category=$category; no tag or GitHub Release created. Raw output suppressed." >&2
  exit 1
fi

printf 'SteamCMD stage=UPLOAD category=OK; committed Workshop item %s.\n' "$STEAM_WORKSHOP_ID"
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  printf 'uploaded=true\n' >> "$GITHUB_OUTPUT"
fi
