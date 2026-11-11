# EPOCH Stable Releases

`main` is the stable branch. Each current, successful push to `main` runs the game-independent CI suite, packages the mod, uploads to the one configured Steam Workshop item, and publishes a normal GitHub Stable Release with the same version. The workflow uses `ubuntu-latest`; it does not install or require Stellaris, Vanilla files, the engine, local game logs, or save files.

## CI test selection

The named CI entry point is `node scripts/test_release_ci.cjs`. It runs these checks in order and stops on the first failure:

| Test | CI coverage |
| --- | --- |
| `test_phase_i_flow.cjs` | Parses EPOCH campaign scripts and checks flow gates and state dispatch. |
| `test_clausewitz_structure.cjs --source-only` | Parses repository Clausewitz files and checks braces/scopes, mod deposit references, localization references, option-resource presentation rules, and bilingual keys. It prints that native Vanilla checks were skipped. |
| `test_resonance.cjs --source-only` | Static checks and a bounded interpreter over EPOCH source. |
| `test_tech_dependencies.cjs` | Checks all 44 EPOCH technologies for valid areas/tiers, defined internal prerequisites, duplicate definitions, and dependency cycles. External Vanilla prerequisite IDs are left to the local native test. |
| `test_stellaris_runtime_log.cjs --self-test` | Exercises the diagnostic classifier using its embedded fixtures; it does not read a user's game logs. |
| `test_stage_iv_d1.cjs` | Checks localization format, English/German parity, references, disclosure wording, and unchanged gameplay files against the fixed Git baseline. |
| `test_stage_iv_d2.cjs --source-only` | Static numeric ledger, dependency/source audit, and gameplay immutability checks. It does not simulate engine behavior or AI. |
| `test_epoch_release.cjs` | Version selection/reuse, package contents and exclusions, descriptor/version consistency, Workshop ID, and incomplete-configuration failures. |

`test_clausewitz_structure.cjs` remains a full native-reference test by default. Its explicit `--source-only` mode skips only the assertions that open Vanilla files: the advisor event example, Vanilla event-picture sprite definitions, blocker/category/modifier definitions, graphical-culture and combat-computer definitions, and the Vanilla building example. The parser and all mod-source structural/reference assertions still run. No Vanilla fixtures are supplied to CI.

The workflow does not run the full `scripts/test_epoch_regressions.ps1` because that suite includes local Stellaris dependencies. In particular, it omits `test_resonance_vanilla.cjs`, `test_narrative_ui.cjs`, native modes of `test_clausewitz_structure.cjs`, `test_stage_iii.cjs`, `test_stage_iv.cjs`, `test_stage_iv_b.cjs`, `test_epoch_core_production.cjs`, `test_epoch_core_icon.cjs`, `test_stage_iv_runtime_contracts.cjs`, `test_stage_iv_c.cjs`, and `test_stage_iv_c_runtime_contracts.cjs`. Those compare with installed game definitions, assets, generated script documentation, or local logs. The runtime-log test runs only its self-test mode. The full local regression suite and all connected gameplay/save-load/AI/multiplayer acceptance remain manual/local Stellaris work. A green CI run is not an Ingame-Abnahme.

## Versioning, tags, and retries

Tags use `stable-vMAJOR.MINOR.PATCH`. The workflow reads semantic versions from Git tags and GitHub Releases. With no previous release, it uses `0.1.0` from `descriptor.mod`; after that it increments the greatest existing patch version. A commit with an existing stable tag reuses that version on rerun.

After the package and test suite pass, the workflow verifies that the event commit is still the current `main` head, then pushes an annotated stable tag for that commit before attempting Steam upload. That tag permanently reserves the version, including when Steam upload fails. A retry of the same commit reuses the reservation. Tags are never force-updated. The workflow serializes releases and checks freshness again before reserving; an old queued/manual run cannot start uploading after a newer commit is current on `main`. If `main` advances during an active upload, the current upload finishes first and the next serialized run publishes the new head.

The descriptor version is changed only in a temporary staging copy. The ZIP and Steam upload use that same staged directory. GitHub Releases are created only after SteamCMD reports an upload success for the configured Workshop ID and the build VDF still names that ID. Steam failure or ambiguous Steam output fails the workflow and does not create/finalize the GitHub Release. If Steam succeeded but GitHub release creation failed, rerun the same current commit: its reserved tag fixes the version and the same existing Workshop item is updated again.

The ZIP contains root `descriptor.mod` plus existing `common/`, `events/`, `localisation/`, `gfx/`, `interface/`, and `compatibility/` content. It excludes `docs/`, `scripts/`, `test-mods/`, `.github/`, hidden files, Git files, tests, and development material. Every prepared ZIP is retained as a 14-day Actions artifact, including package-only dry runs.

## GitHub Actions configuration

Set this repository variable:

| Name | Required | Meaning |
| --- | --- | --- |
| `STEAM_WORKSHOP_ID` | For upload | Numeric ID of the one official EPOCH Workshop item. |

Set these repository secrets:

| Name | Required | Meaning |
| --- | --- | --- |
| `STEAM_USERNAME` | For upload | Steam account name authorized to update the EPOCH Workshop item. |
| `STEAMCMD_CONFIG_VDF` | For upload | Base64 encoding of the `config/config.vdf` written by SteamCMD after a successful, Steam-Guard-authorized login. This file contains reusable Steam authentication state; protect and rotate it like a password. |

If all three are absent, a run builds and tests the package, saves the artifact, and reports **prepared only** without creating a tag, Steam upload, or GitHub Release. A partial configuration fails closed. A manual workflow run on `main` with `dry_run=true` always stops after preparation, even when Steam secrets exist. A dispatch from any other branch is ignored.

## One-time Workshop and SteamCMD setup

Use the existing official EPOCH Workshop item and its ID. If there is no item yet, create one regular public stable item once through the Stellaris mod publishing flow, set its visibility and description/images manually, and then save its numeric ID as `STEAM_WORKSHOP_ID`. The workflow always supplies this nonzero ID as `publishedfileid`; Steamworks documents that nonzero IDs update an existing item, while unset/zero IDs create one. The workflow omits description, preview, and visibility fields so it does not replace those settings. [Steamworks Workshop upload documentation](https://partner.steamgames.com/doc/features/workshop/implementation).

Create a SteamCMD session for the authorized publishing account on a trusted machine. Install SteamCMD, log in interactively, enter the password only at its prompt, then complete the current Steam Guard challenge using the official Steam Mobile app/email method Steam requests. After a successful login, take the `config/config.vdf` created in that SteamCMD installation, base64-encode its bytes, and store the result as the GitHub Actions secret `STEAMCMD_CONFIG_VDF`. Do not copy a normal Steam client/browser session, print this file or encoded value, or put it in the repository, workflow artifacts, or logs. Steamworks advises preserving SteamCMD's `config.vdf` between runs; Steam Guard may still reject a fresh hosted-runner login, in which case this workflow aborts without a GitHub Release. [Steamworks SteamCMD login guidance](https://partner.steamgames.com/doc/sdk/uploading), [Steam Guard guidance](https://help.steampowered.com/en/faqs/view/06B0-26E6-2CF8-254C).

On each hosted run, the secret is restored only into a temporary SteamCMD config file with owner-only permissions. SteamCMD output is captured and suppressed from logs; the workflow accepts only a recognized success message carrying the configured Workshop ID, a zero command exit, and a matching post-run VDF. If Steam Guard requires new authorization, refresh the session on a trusted machine through a normal interactive SteamCMD login and replace the secret. Do not disable or bypass Steam Guard.

## First automatic upload checklist

1. Review and merge PR #22; this task will not merge it.
2. Run **Actions → EPOCH Stable Release → Run workflow** on `main` with `dry_run=true`. Confirm the 8 game-independent test commands pass and inspect the package artifact.
3. Confirm or manually create the single official public Workshop entry; preserve its description and images, then set `STEAM_WORKSHOP_ID`.
4. Perform an interactive SteamCMD login and Steam Guard authorization for an account that can update that item. Store the resulting SteamCMD `config/config.vdf` as the `STEAMCMD_CONFIG_VDF` secret and set `STEAM_USERNAME` as a secret.
5. Dispatch once on `main` with `dry_run=false`. Verify the reported Workshop ID and matching GitHub release/tag/version. This real upload check is a publishing-function test, not a gameplay test.
6. After the first successful setup, each current `main` push that passes the CI suite triggers the stable publication automatically.
