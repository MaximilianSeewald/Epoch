# EPOCH Stable Releases

`main` is the only release branch. Every successful push to `main` runs the Windows regression suite, creates a clean Stellaris package, and selects a stable version. Development branches and release candidates are outside this workflow.

## Version selection and recovery

The release tag format is `stable-vMAJOR.MINOR.PATCH`. If the current commit already has a matching stable tag, a retry reuses its version. Otherwise, the next patch after the greatest semantic version found among Git tags and GitHub Releases is selected. With no release tags/releases, the descriptor version (`0.1.0`) is used. Release tags point at the commit being packaged. GitHub Releases created by this workflow are published, non-draft, non-prerelease releases.

The version is substituted in a temporary copy of `descriptor.mod`; the source tree is never version-committed. The ZIP and Steam upload use the same staged tree and version. A serial GitHub Actions concurrency group prevents overlapping uploads. The ZIP contains `descriptor.mod` and the mod's `common/`, `events/`, `localisation/`, `gfx/`, `interface/`, and `compatibility/` directories when present. It excludes documentation, scripts, tests, Git data, and other development files.

The run summary distinguishes a prepared package from a complete release. When no Workshop ID and no Steam credentials are configured, the workflow completes as package-only and retains a 14-day ZIP artifact; it creates neither a Workshop update nor a GitHub Release. A partial Steam configuration fails closed. A SteamCMD error prevents GitHub Release finalization. If Steam reports success but GitHub release creation fails, rerun the same workflow on the same commit: the version calculation is deterministic, the same Workshop item is updated, and the same release tag is recovered or created. If a tag already points at a different commit, the workflow stops for manual recovery.

## GitHub Actions configuration

Set these repository variables under **Settings → Secrets and variables → Actions → Variables**:

| Name | Required | Value |
| --- | --- | --- |
| `EPOCH_VANILLA_ROOT` | Yes | Path on the Windows runner to the Stellaris 4.5.3 installation or its native script documentation. The existing regression suite uses it to compare against engine definitions. |
| `EPOCH_LOG_DIRECTORY` | No | Existing Stellaris log directory to include in the regression report. If omitted, the workflow uses an empty temporary directory. |
| `STEAM_WORKSHOP_ID` | For upload | Numeric ID of the single official EPOCH Workshop item. |
| `STEAMCMD_EXE` | For upload | Absolute path to `steamcmd.exe` on the dedicated runner. |

Set these repository secrets after preparing Steam Guard:

| Name | Required | Value |
| --- | --- | --- |
| `STEAM_USERNAME` | For upload | Dedicated Steam publishing account username. |

For a package-only check, leave `STEAM_USERNAME` and the Workshop ID unset. For a forced dry run even after configuration, run **Actions → EPOCH Stable Release → Run workflow** and set `dry_run` to `true`. A workflow dispatch on a branch other than `main` is ignored.

### Runner and native test prerequisites

The workflow uses a dedicated Windows self-hosted runner labeled `epoch-steam`, PowerShell, Node 22, and GitHub CLI (`gh`). This is required because the existing regression suite compares against native Stellaris files and Steam Guard authorization must be established once on a persistent, controlled machine. Configure `EPOCH_VANILLA_ROOT` and `STEAMCMD_EXE` to paths available to the runner's service account. GitHub-hosted runners are ephemeral and cannot retain a trusted SteamCMD session between pushes. Do not use a self-hosted runner for untrusted pull request workflows.

## One-time Workshop setup

If an official EPOCH item already exists, use its published Workshop ID and do not create another item. If none exists:

1. In Stellaris, create one regular Workshop mod item for EPOCH through the game's mod publishing flow. Publish it once with the normal EPOCH title, description, and artwork.
2. In the item's Steam Workshop page, choose the intended public visibility and save the description and images. The workflow does not set visibility and omits description and preview fields from update metadata to preserve the page's existing presentation.
3. Copy the numeric ID from that item's Workshop URL into the `STEAM_WORKSHOP_ID` repository variable.
4. Do not change the ID later. Subsequent runs always set the existing `publishedfileid` in the SteamCMD VDF and never issue a create-item operation.
5. Verify that the item's current description, preview image, visibility, and EPOCH content are correct before enabling the secrets.

The initial item creation is a one-time manual step because the automated workflow must never create or select a second item. The actual upload verification must be run once after the ID and authentication are configured; it updates this same item.

## Steam Guard setup

Use a Steam account authorized to publish the mod and protect it with Steam Guard Mobile Authenticator. Steam Guard codes change every 30 seconds; Steam's documented login options are a mobile approval or a current code from the mobile app ([Steam Guard setup](https://help.steampowered.com/en/faqs/view/6891-E071-C9D9-0134), [Steam Guard details](https://help.steampowered.com/en/faqs/view/7EFD-3CAE-64D3-1C31)). Since this pipeline uses SteamCMD without bypassing the challenge or storing an authenticator secret in GitHub, prepare a dedicated self-hosted runner and authorize its SteamCMD login once:

1. Install the Windows GitHub Actions runner as a dedicated Windows service account. Restrict the runner group to this repository and keep it off workflows that run code from forks or pull requests.
2. Install SteamCMD in a persistent location accessible to that service account. Install/locate the licensed Stellaris 4.5.3 game files and configure the Actions variables `EPOCH_VANILLA_ROOT` and `STEAMCMD_EXE`.
3. Start SteamCMD interactively as the runner service account. Run `login <SteamUsername>` and follow SteamCMD's password prompt; then enter the current Steam Guard code from the official Steam Mobile app or approve the login if Steam requests it. Complete any new-device confirmation and wait for SteamCMD to report successful login. Do not put the password or Guard code in shell history or command-line arguments.
4. Exit SteamCMD normally so it can retain the trusted login state it created under that service account. Do not copy an existing browser cookie, `loginusers.vdf`, `config.vdf`, or Steam session from a developer PC. Keep the runner machine access restricted, encrypted, and dedicated to this repository; never include SteamCMD state in artifacts, logs, or the Git repository.
5. Add `STEAM_USERNAME` as a GitHub Actions secret and `STEAM_WORKSHOP_ID` as a repository variable. The workflow invokes `steamcmd +login <username>` using the runner's own previously authorized SteamCMD session. It does not retrieve or print the session data. If Steam expires/revokes the session or requests Guard again, the upload fails closed; sign in interactively on that runner with a fresh Guard approval, then retry the same commit.

This setup preserves Steam Guard authorization on a controlled runner instead of attempting an unattended code-generation or email challenge on disposable hosted runners. Do not disable Steam Guard. GitHub Secrets should be restricted to repository administrators.

## First automatic release checklist

1. Merge this draft PR to `main` only after review; the PR itself must not be merged by this task.
2. Confirm the dedicated self-hosted runner is online, `EPOCH_VANILLA_ROOT` resolves to Stellaris 4.5.3/native definitions, and run the workflow once with `dry_run=true`.
3. Confirm the output artifact has a root `descriptor.mod`, identical version in its manifest, and only required game content.
4. Identify the existing official EPOCH item or manually create the single public stable item, then set `STEAM_WORKSHOP_ID`.
5. Complete the interactive SteamCMD login and Steam Guard authorization on the dedicated runner, then configure `STEAM_USERNAME` as a repository secret. Confirm the account can publish Stellaris Workshop content.
6. Run one controlled workflow dispatch on `main` with `dry_run=false`. Confirm the configured Workshop ID is returned by SteamCMD and the matching non-prerelease GitHub Release is created.
7. Once that succeeds, future successful pushes to `main` perform the stable release automatically.

No in-game gameplay test is run as part of the upload check. A failed regression, Steam Guard/authentication failure, or SteamCMD upload error blocks release finalization. A prepared ZIP remains available as a workflow artifact for investigation and retry.
