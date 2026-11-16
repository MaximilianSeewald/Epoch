# Isolated Issue #36 probe

Test-only overlay, never include in the Workshop package. The runner writes
UTF-8 without BOM, renders unique marker IDs, and enables only this overlay and
an exact Git archive of EPOCH in its fresh test profile.

`-LoadCandidate -SeedProbe` marks newly generated human countries. The native
save-load hook checks persisted flags inside its effect; dispatching the event
alone cannot manufacture a successful marker check. Save creation and UI loading
were executed by the agent; they are not yet a reusable PowerShell UI driver.

The locally retained fixture is documented in the
[engine follow-up](../../docs/research/issue-36-engine-2026-11-16/follow-up.md).
Inspect its identity with:

```powershell
powershell.exe -NoProfile -File .\scripts\inspect_stellaris_seed.ps1 -SavePath 'G:\EPOCH-Stellaris-Test\fixtures\seed-save-load-v1\save games\unitednationsofearth_-15512622\2200.01.01.sav' -RunId '20261116T084837419Z-139118c3'
```

Experimental scenario setup (still blocked, not an acceptance test):

```powershell
powershell.exe -NoProfile -File .\scripts\test_stage_iv_engine.ps1 -SeedFixtureDirectory 'G:\EPOCH-Stellaris-Test\fixtures\seed-save-load-v1' -BattleAttempt -CandidateShips 1000 -DebugMode -TimeoutSeconds 900
```

`epoch36_battle_attempt.txt.in` is rendered only for this explicit option. It
prepares campaign prerequisites, invokes the product guardian spawn, and creates
a candidate fleet. Attack orders, combat, withdrawal, cooldown and victory are
left to product paths. Daily observations stop at 720 game days; the process has
a separate wall-clock timeout. The observer hooks have not yet been validated in
actual combat. The 1000-ship trial exceeded the power threshold but did not yield
an observed attack; the native AI defaulted economically. A stable, fully
eligible fleet at monthly reconciliation and a survived retreat remain missing.

Neither the runner nor this overlay can report the requested regression PASS.
