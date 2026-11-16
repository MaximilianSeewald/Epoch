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

## First monthly AI order (#33)

```powershell
powershell.exe -NoProfile -File .\scripts\test_stage_iv_engine.ps1 -SeedFixtureDirectory 'G:\EPOCH-Stellaris-Test\fixtures\seed-save-load-v1' -FirstMonthOrder -DebugMode -TimeoutSeconds 300
```

Use the already verified local UI load path for this fixture and unpause. A
local desktop agent can perform those actions. The runner has no integrated UI
driver. After the next native monthly pulse and one in-game day, the runner
stops its own process and writes the compact `firstMonthOrder` result in
`report.json`. Do not invoke the production attack event from the console.

The fixture uses the previously observed 1000 Enforcers by default, plus a
temporary naval-capacity, storage and upkeep budget with initial supplies. The
probe reads missing country, ownership, fleet, access, health, strength and
deficit conditions at the pulse when the order flag is still clear. The
observer and the production selector share the same pulse, so the observer
can run before or after selection. The extra day catches an order issued
after the pulse observer ran. Economic support is part of the fixture and
still needs confirmation in Stellaris.

Exit 0 for this option means the first monthly order is evidenced for the
owned candidate and its personal guardian, with the marked save and isolated
run verified. Exit 3 reports a blocked probe and its available evidence,
including any missing prerequisites. The top-level report status still
tracks the full combat regression. Combat, retreat, the cooldown and the
next order are tracked in #36.
