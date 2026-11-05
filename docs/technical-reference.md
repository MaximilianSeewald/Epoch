# Stellaris 4.5.3 technical reference

**Purpose:** M0-B source verification for EPOCH. No gameplay scripts or mechanics
are implemented by this document.

## Dataset and evidence boundary

The inspected local reference is `C:\Users\Maxim\Desktop\EPOCH_M0B_Source`.
It contains 168 game-data files in a curated `common/` and `events/` subset plus
`file_manifest.csv` (169 files total). The manifest records paths and byte lengths, but does not
record the Stellaris version, Steam App-ID, Build-ID, file hashes, or extraction
method. Stellaris 4.5.3, App-ID 281990, Build-ID 26325427 are the requested
target metadata, not independently verified dataset provenance. No source files
were copied into this repository.

`VERIFIED – SOURCE` below means the cited definition exists in the supplied
reference subset. It does not prove parser acceptance, runtime behavior, MP
determinism, or provenance of the subset. `VERIFIED – RUNTIME` is reserved for
reproducible in-game tests; none were possible in this pass. `PROPOSED` identifies
an EPOCH design recommendation. `UNVERIFIED` identifies a gap in available
evidence.

See [`evidence/m0-b-engine-verification.md`](evidence/m0-b-engine-verification.md)
for the claim-by-claim source matrix and line anchors.

## Events, hooks, scope, and discovery

The source defines `on_game_start` and `on_game_start_country` in
`common/on_actions/00_on_actions.txt`. The former is explicitly commented as
having no scope; the latter dispatches its event list per country. The global
hook already has many handlers, so EPOCH should not perform an all-country scan
there if a per-country hook is suitable. A country hook can evaluate that
country's eligibility locally and schedule its own delayed event. A persistent
country marker and a repeated eligibility check at delivery are recommended for
idempotency and stale schedules, but save/load behavior was not runtime-tested.

Vanilla event definitions in `events/situation_events.txt` show
`namespace = situation`, explicit event types such as `country_event`,
`carrier_event`, and `situation_event`, an ID in the namespace, and fields such
as `is_triggered_only`, `trigger`, `immediate`, `option`, and `after`. In the
same file, a `country_event` starts a situation and saves its new situation as
an event target. Delayed events appear in source as `country_event = { id = ...
days = ... }`, including `events/on_action_events_2.txt`. Thus a per-country
event chain and day-based delay are source-supported patterns. The exact
variation/random-delay grammar, event execution ordering, and target lifetime
still need parser and runtime validation before implementation.

`any_country`, `every_country`, and `random_country` occur in
`common/scripted_effects/00_scripted_effects.txt`; these establish source
examples of country iteration, not a need to use iteration for EPOCH bootstrap.
The proposed approach is to avoid it. Flags and reusable scripted effects and
triggers also have examples in the supplied files; use explicit expected caller
scope and keep effects idempotent. Do not infer persistence guarantees or exact
scope-transition legality from names alone.

The source comment for `on_single_player_save_game_load` says it does not run
when loading MP saves due to OOS concerns. This is a concrete reason not to use
that hook as an MP recovery mechanism. Other MP safety claims need runtime tests.

## Situations

`common/situations/99_README_SITUATIONS.txt` documents the situation root as
`this`/root, owner and target scope access, country `potential`, progress and
stages, approaches, monthly events/progress, completion and failure, abort
handling, and situation-log text overrides. It explicitly recommends destroying
the situation from completion/failure effects. Concrete definitions in
`common/situations/01_narrative_situations.txt` include staged thresholds,
approach-dependent progress and event effects. `events/situation_events.txt`
demonstrates `start_situation`, retaining the created situation as an event
target, `set_situation_approach`, and later situation events. This is a good
source-supported fit for a long-running, empire-owned investigation whose
progress responds to player choices.

Situation progress is monthly by design in the cited documentation and examples.
That is per-active-situation work, not a recommendation for a recurring
galaxy-wide empire scan. The cost and update cadence at scale were not measured.
Approach names and effects need to cover regular, Hive Mind, and machine
intelligences; source examples show gestalt-specific triggered descriptions but
do not establish universal compatibility for any proposed EPOCH definition.

## Special projects

`common/special_projects/00_projects_1.txt` shows project keys, cost, research
duration, technology department, picture/icon, event scope, requirements, and
`on_success`/`on_fail` effects. Examples dispatch follow-up events on success;
some projects link into an event chain. Other supplied effects call
`enable_special_project`. This supports a project as a focused task and an event
as its completion continuation. A project is not itself a substitute for a
multi-stage situation: use one when the task model is a discrete research
assignment, and connect it through its completion event. AI selection,
abandonment/retry, and failure behavior need additional validation for the
chosen project type.

## Script systems and eligibility

The supplied `common/scripted_effects/`, `common/scripted_triggers/`, and
`common/scripted_variables/` files contain reusable named definitions, variable
operations, flag checks, country traversal, event dispatch, and inline-script
calls. These support factoring common EPOCH gates and side effects after exact
contexts and parameter rules are verified.

The supplied subset does **not** include `common/script_values/` or
`common/inline_scripts/`; it contains references to inline scripts but not their
definitions. It also does not contain AI personality/weight directories. Those
systems cannot be verified comprehensively from this reference. Build one shared
eligibility rule for organics, Hive Minds, and Machine Intelligences; assess
specific country-type checks and AI automation once the missing sources are
available. No start bonuses or technology-gated discovery are proposed.

## AI

The on-action and event examples establish that event chains can be started by
hooks and that event choices can have trigger and AI-related fields in the
source. The sampled corpus does not include the full AI weight/automation
definitions needed to recommend exact behavior. EPOCH should provide an
AI-safe deterministic option or verified weights for every blocking choice,
using the same eligibility and costs as player empires. This remains PROPOSED;
AI parity was not runtime-tested.

## Localisation and UI

The inspected dataset has no `localisation/`, `gfx/`, or interface asset
directories. Situation documentation names expected situation text keys and
source definitions reference event and GFX keys, but file encoding, language
headers, key conventions, icon availability, and actual UI rendering cannot be
verified from this subset. Provide English and German keys for all player-facing
content and validate them in game before release.

## Multiplayer and performance

Source evidence supports event-driven chaining and a per-country game-start
entry point. It does not prove synchronization, deterministic random draws,
exactly-once behavior, desync safety, or performance. Avoid client-local state
and avoid a recurring global enumeration. Keep state on the owning country,
schedule at most one callback per eligible country, recheck eligibility at
delivery, and make repeated dispatch harmless. Validate save/load, host/client,
and large empire counts in runtime tests.

## Packaging

No vanilla `descriptor.mod`, launcher `.mod`, Workshop metadata, or game
installation files are present in the supplied reference. Repository
`descriptor.mod` is EPOCH's internal descriptor; it declares
`supported_version="4.5.*"`. This verifies only the repository text, not
launcher recognition, external descriptor requirements, Workshop layout,
dependency syntax, or load order. Keep the Core independently installable and
put all Gigastructures references in the separate optional compatibility package.
Verify descriptors and activation in the launcher/game before implementation
or publication.
