#!/usr/bin/env bash
set -euo pipefail

: "${RUNNER_TEMP:?RUNNER_TEMP is required}"
: "${GITHUB_WORKSPACE:?GITHUB_WORKSPACE is required}"
: "${STEAM_USERNAME:?STEAM_USERNAME is required}"
: "${STEAMCMD_CONFIG_VDF:?STEAMCMD_CONFIG_VDF is required}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"
: "${STEAM_WORKSHOP_ID:?STEAM_WORKSHOP_ID is required}"
: "${RELEASE_VERSION:?RELEASE_VERSION is required}"
: "${COMMIT_SHA:?COMMIT_SHA is required}"

steam_home="$RUNNER_TEMP/steam-home"
steam_dir="$steam_home/Steam"
archive="$RUNNER_TEMP/steamcmd.tar.gz"
upload_log="$RUNNER_TEMP/steamcmd-output.log"
vdf="$RUNNER_TEMP/epoch-workshop.vdf"
config_path="$steam_dir/config/config.vdf"
package="$RUNNER_TEMP/epoch-mod-package"

cleanup() { rm -rf -- "$steam_home" "$archive" "$vdf"; rm -f -- "$upload_log"; }
trap cleanup EXIT
mkdir -p "$steam_dir"
export HOME="$steam_home"
[[ "$STEAM_WORKSHOP_ID" =~ ^[1-9][0-9]{5,19}$ ]] || { echo 'Steam Workshop ID is invalid.' >&2; exit 1; }
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
timeout --kill-after=15s 300s ./steamcmd.sh +login "$STEAM_USERNAME" +workshop_build_item "$vdf" +quit > "$upload_log" 2>&1
status=$?
set -e
if [[ "$status" -ne 0 ]]; then
  printf 'SteamCMD upload process failed (exit code %s); raw output suppressed.\n' "$status" >&2
  exit 1
fi
printf 'SteamCMD completed successfully for Workshop %s.\n' "$STEAM_WORKSHOP_ID"
printf 'uploaded=true\n' >> "$GITHUB_OUTPUT"
