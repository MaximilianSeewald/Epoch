# EPOCH Stable Releases

`main` is the stable branch. Each current, successful push to `main` runs the game-independent CI suite, packages the mod, uploads to the one configured Steam Workshop item, and publishes a normal GitHub Stable Release with the same version. The workflow uses `ubuntu-latest`; it does not install or require Stellaris, Vanilla files, the engine, local game logs, or save files.

## CI test selection

The named CI entry point is `node scripts/test_release_ci.cjs`. It runs only checks that do not need Stellaris, Vanilla files, the engine, local logs, or save files. The current selection is:

| Test | CI coverage |
| --- | --- |
| `test_phase_i_flow.cjs` | Parses EPOCH campaign scripts and checks flow gates and state dispatch. |
| `test_clausewitz_structure.cjs --source-only` | Parses mod Clausewitz files and checks structure, mod references, localization references, option-resource presentation rules, and bilingual keys. Vanilla-backed assertions are explicitly skipped. |
| `test_resonance.cjs --source-only` | Static checks and a bounded interpreter over EPOCH source; no engine simulation. |
| `test_tech_dependencies.cjs --source-only` | Checks all EPOCH technology definitions, valid identifiers/areas/tiers, internal prerequisites, duplicates, and dependency cycles. New definitions are allowed. External Vanilla prerequisite definitions remain a local check. |
| `test_localization_consistency.cjs` | Checks localization syntax, UTF-8 BOMs, unique keys, EN/DE parity, and nested references. New bilingual keys are allowed; there is no historical key-count baseline. |
| `test_epoch_economy_consistency.cjs` | Recomputes economy scenarios from current source tables and checks accounting identities and inputs. It does not freeze historical balance numbers or simulate game behavior. |
| `test_stellaris_runtime_log.cjs --self-test` | Exercises the diagnostic classifier using embedded fixtures; it does not read a user's game logs. |
| `test_steam_upload_result.cjs` | Tests positive and negative SteamCMD result parsing; it never contacts Steam. |
| `test_release_ci_regression.cjs` | Adds a valid new technology, event, and matching bilingual keys in a temporary copy, then runs the selected CI checks to guard against historical-file comparisons. |
| `test_epoch_release.cjs` | Version selection/reuse, package contents/exclusions, descriptor/version consistency, Workshop ID, and incomplete-configuration failures. |

The D1/D2 historical acceptance checks (`test_stage_iv_d1.cjs` and `test_stage_iv_d2.cjs`) remain individually executable and are still part of `scripts/test_epoch_regressions.ps1`. They are intentionally not release gates: their historical baselines would reject legitimate future gameplay and localization additions. They have not been weakened; they remain available when reproducing those historical acceptance checks.

`test_clausewitz_structure.cjs` remains a full native-reference test by default. Its explicit `--source-only` mode skips assertions that open Vanilla files, including the advisor event example, Vanilla event-picture sprite definitions, blocker/category/modifier definitions, graphical-culture and combat-computer definitions, and the Vanilla building example. No fabricated Vanilla fixtures are supplied to CI.

The full local `scripts/test_epoch_regressions.ps1` suite requires an installed Stellaris tree for Vanilla comparisons. It additionally runs `test_resonance_vanilla.cjs`, `test_narrative_ui.cjs`, native `test_clausewitz_structure.cjs`, `test_stage_iii.cjs`, `test_stage_iv.cjs`, `test_stage_iv_b.cjs`, `test_epoch_core_production.cjs`, `test_epoch_core_icon.cjs`, `test_stage_iv_runtime_contracts.cjs`, `test_stage_iv_c.cjs`, and `test_stage_iv_c_runtime_contracts.cjs`. The selected tests that assert particular campaign contracts or balance values are source snapshots, not complete gameplay tests. Actual campaign progression, balance, AI, multiplayer, save/load and presentation still require manual/local Stellaris playtesting. A green CI status is explicitly not a complete in-game acceptance.
## Versioning, tags, and retries

Tags use `stable-vMAJOR.MINOR.PATCH`. The workflow reads semantic versions from Git tags and GitHub Releases. With no previous release, it uses `0.1.0` from `descriptor.mod`; after that it increments the greatest existing patch version. A commit with an existing stable tag reuses that version on rerun.

After tests and package validation, the workflow verifies that the commit is current on `main`. It then restores SteamCMD's saved session and performs the **same direct** `+login ACCOUNT +workshop_build_item upload.vdf +quit` operation that successfully published EPOCH 0.1.4 from WSL. There is no separate strict login-text gate. A tag is reserved only **after** the actual Workshop upload has been confirmed, followed by the GitHub stable Release. Failed or unconfirmed uploads therefore cannot consume version tags. If the upload succeeds but tagging or GitHub Release creation fails, a retry may re-upload the same content; all tags remain immutable.

The ZIP and Steam update use the same staged mod directory. Verification requires SteamCMD exit code 0, an unchanged VDF targeting the configured nonzero Workshop ID, and either a positive published-ID confirmation for that exact ID or the native SteamCMD lifecycle `Preparing update...` + `Uploading content....` + `Committing update...Success.`. The latter does not echo the Workshop ID; its target is checked against the passed VDF instead. Reported upload or authentication errors, missing milestones, different IDs and timeouts all fail closed. Session files are removed in a cleanup trap and the workflow cleanup step.

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

On each hosted run, the upload script initializes SteamCMD in an isolated `HOME` under `$RUNNER_TEMP`, restores `config.vdf` after bootstrap, and invokes `+login ... +workshop_build_item ... +quit` **in one process**. It captures SteamCMD output only for internal validation; raw logs, account names, passwords and session data are not printed. It sets the `uploaded=true` output only after verification, and only this output can enable the later stable tag and GitHub Release. The standalone Authentication Probe is still available for diagnosis, but its conservative login-text parser no longer blocks a confirmed Workshop upload. The new PR regression workflow requires no Steam secrets and cannot publish.

Use **Actions → EPOCH SteamCMD Authentication Probe → Run workflow** to investigate login without depending on the release workflow's dry-run input. This workflow installs and initializes SteamCMD, restores only the saved session, and runs `+login … +quit`. It has read-only repository permissions and contains no version, tag, Workshop-upload, or Release step. It emits fixed safe indicators for console startup, Steam API initialization, saved-credential use hints, interactive password/Steam Guard prompts, authentication/network/session errors, output presence, process exit, and strict login markers. Raw SteamCMD output, account names, and session data are never written to the Actions log or summary. `saved_credentials_indicated=no` means SteamCMD did not emit a recognized cached-credential hint; it does not prove that the config file was ignored.

For a local WSL reproduction with an authorized session, run `bash scripts/test_steamcmd_environment.sh` after supplying `STEAM_USERNAME` and `STEAMCMD_CONFIG_VDF` in that WSL shell. The script downloads a fresh archive from the official Linux SteamCMD endpoint, creates a clean temporary `HOME`, bootstraps SteamCMD before restoring only `config.vdf`, runs the same login helper as GitHub Actions, then removes the entire temporary directory on exit. It does not print either environment variable or SteamCMD's raw output. WSL and GitHub-hosted Ubuntu can still differ in Ubuntu/kernel and library versions, network egress/IP reputation, DNS/routing, host timing, and the SteamCMD/Steam Guard service response. A local result therefore narrows the environment question but does not establish the hosted runner's behavior.

## First automatic upload checklist

1. Review and merge the release-pipeline fix only after the separate PR regression tests are green.
2. Run **Actions → EPOCH Stable Release → Run workflow** on `main` with `dry_run=true`. Confirm all 10 game-independent test commands pass and inspect the package artifact.
3. Confirm or manually create the single official public Workshop entry; preserve its description and images, then set `STEAM_WORKSHOP_ID`.
4. Perform an interactive SteamCMD login and Steam Guard authorization for an account that can update that item. Store the resulting SteamCMD `config/config.vdf` as the `STEAMCMD_CONFIG_VDF` secret and set `STEAM_USERNAME` as a secret.
5. Dispatch once on `main` with `dry_run=false`. Verify the reported Workshop ID and matching GitHub release/tag/version. This real upload check is a publishing-function test, not a gameplay test.
6. After the first successful setup, each current `main` push that passes the CI suite triggers the stable publication automatically.
