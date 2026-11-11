#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
temp_root="$(mktemp -d "${TMPDIR:-/tmp}/epoch-steamcmd-env.XXXXXXXX")"
case "$temp_root" in
	"${TMPDIR:-/tmp}"/*) ;;
	*) printf 'Temporary SteamCMD test path escaped TMPDIR.\n' >&2; exit 1 ;;
esac
cleanup() { rm -rf -- "$temp_root"; }
trap cleanup EXIT HUP INT TERM

if [[ -z "${STEAM_USERNAME:-}" || -z "${STEAMCMD_CONFIG_VDF:-}" ]]; then
	printf 'Set STEAM_USERNAME and STEAMCMD_CONFIG_VDF in the environment; values are never printed.\n' >&2
	exit 2
fi

export GITHUB_WORKSPACE="$repo_root"
export RUNNER_TEMP="$temp_root"
unset GITHUB_OUTPUT GITHUB_STEP_SUMMARY
bash "$repo_root/scripts/steamcmd_login_probe.sh"
