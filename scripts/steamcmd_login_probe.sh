#!/usr/bin/env bash
set -euo pipefail

: "${RUNNER_TEMP:?RUNNER_TEMP is required}"
: "${GITHUB_WORKSPACE:?GITHUB_WORKSPACE is required}"
: "${STEAM_USERNAME:?STEAM_USERNAME is required}"
: "${STEAMCMD_CONFIG_VDF:?STEAMCMD_CONFIG_VDF is required}"

steam_home="$RUNNER_TEMP/steam-home"
steam_dir="$steam_home/Steam"
archive="$RUNNER_TEMP/steamcmd.tar.gz"
config_path="$steam_dir/config/config.vdf"

is_safe_diagnostics() {
	[[ "$1" =~ ^category=(OK|STEAM_[A-Z_]+)\ console_start_reached=(yes|no)\ steam_api_loaded=(yes|no)\ saved_credentials_indicated=(yes|no)\ password_interaction_requested=(yes|no)\ steam_guard_interaction_requested=(yes|no)\ authentication_error_detected=(yes|no)\ connection_error_detected=(yes|no)\ session_error_detected=(yes|no)\ usable_console_output_received=(yes|no)\ exitcode_successful=(yes|no)\ login_marker_recognized=(yes|no)\ client_config_recognized=(yes|no)\ user_info_recognized=(yes|no)$ ]]
}

mkdir -p "$steam_dir" "$steam_home"
export HOME="$steam_home"

sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install -y lib32gcc-s1 lib32stdc++6
curl --fail --silent --show-error --location https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz -o "$archive"
tar -xzf "$archive" -C "$steam_dir"

# Bootstrap before restoring the reusable session so self-update cannot
# overwrite or reinterpret the saved config.vdf.
cd "$steam_dir"
set +e
init_output="$(./steamcmd.sh +quit 2>&1)"
init_status=$?
set -e
set +e
init_diagnostics="$(printf '%s' "$init_output" | node "$GITHUB_WORKSPACE/scripts/steam_failure_classification.cjs" initialize "$init_status" --diagnostics 2>/dev/null)"
init_diagnose_status=$?
set -e
unset init_output
if ! is_safe_diagnostics "$init_diagnostics"; then
	init_diagnostics='category=STEAM_UNKNOWN_ERROR'
	init_diagnose_status=1
fi
printf 'SteamCMD stage=INITIALIZE %s\n' "$init_diagnostics"
init_category="${init_diagnostics%% *}"
init_category="${init_category#category=}"
unset init_diagnostics
if [[ $init_diagnose_status -ne 0 || "$init_category" != OK ]]; then
	printf 'SteamCMD initialization failed; session restore, login, and version reservation are blocked. Raw output suppressed.\n' >&2
	exit 1
fi

mkdir -p "$(dirname "$config_path")"
if ! printf '%s' "$STEAMCMD_CONFIG_VDF" | base64 --decode 2>/dev/null > "$config_path" || [[ ! -s "$config_path" ]]; then
	printf 'SteamCMD stage=CONFIG category=STEAM_UNKNOWN_ERROR; saved session could not be restored; output suppressed.\n' >&2
	exit 1
fi
chmod 600 "$config_path"
if [[ ! -s "$config_path" || ! -r "$config_path" ]]; then
	printf 'SteamCMD stage=CONFIG category=STEAM_UNKNOWN_ERROR; restored session is missing or unreadable; output suppressed.\n' >&2
	exit 1
fi
printf 'SteamCMD stage=CONFIG category=OK; config restored at the isolated Linux runtime path.\n'

set +e
login_output="$(./steamcmd.sh +login "$STEAM_USERNAME" +quit 2>&1)"
login_status=$?
set -e
set +e
login_diagnostics="$(printf '%s' "$login_output" | node "$GITHUB_WORKSPACE/scripts/steam_failure_classification.cjs" login "$login_status" --diagnostics 2>/dev/null)"
diagnose_status=$?
set -e
unset login_output

if ! is_safe_diagnostics "$login_diagnostics"; then
	login_diagnostics='category=STEAM_UNKNOWN_ERROR'
	diagnose_status=1
fi
printf 'SteamCMD stage=LOGIN %s\n' "$login_diagnostics"
login_category="${login_diagnostics%% *}"
login_category="${login_category#category=}"
unset login_diagnostics
if [[ $diagnose_status -ne 0 || "$login_category" != OK ]]; then
	printf 'SteamCMD login probe failed; upload and version reservation are blocked. Raw output suppressed.\n' >&2
	exit 1
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
	printf 'login=ok\n' >> "$GITHUB_OUTPUT"
fi
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
	printf 'SteamCMD login confirmed; safe diagnostics recorded above.\n' >> "$GITHUB_STEP_SUMMARY"
fi
