# Stellaris technical reference for EPOCH

**Target:** Stellaris PC 4.5.3. **Research status:** 4.5.3 game files are not
available in this workspace. No engine feature below is claimed verified against
that release. Verify engine-dependent details against the installed game files and
in-game before implementation. Examples are intentionally not executable script.

## Status labels

- **Verified for Stellaris 4.5.3:** checked against 4.5.3 files and/or direct
  runtime validation. No engine feature in this document currently has this status.
- **Older/community documentation; not verified for 4.5.3:** conventions described
  by earlier or community references that may have changed or have contextual limits.
  Exact source files are unavailable, so concepts below are cautious summaries.
- **Proposed EPOCH architecture:** design choices, not claims about engine support.

Version-dependent items are marked **UNVERIFIED – requires Stellaris 4.5.3 game
files**.

## Repository structure and descriptors

**Verified in repository:** root-level `common/`, `events/`, `gfx/`,
`localisation/`, and `compatibility/gigastructures/` exist. `docs/` contains the
project documents. Placeholder-only directories use `.gitkeep`. The root
`descriptor.mod` is the internal source descriptor. An external launcher `.mod`
is a separate packaging artifact and should not be placed inside Workshop source
without a documented reason. The internal descriptor previously had
`path="mod/EPOCH"`, which pointed to a nonexistent source-tree path; that entry
has been removed. Exact launcher packaging behavior remains to be confirmed.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files** for
descriptor keys, recognised content directories, and external launcher behavior.
Scaffold directory names do not prove that their eventual subfolders match engine
conventions.

## Event namespaces and IDs

**Older/community documentation, not verified:** event definitions conventionally
use a namespace and identifiers composed from namespace plus event name/ID.
Prefixes reduce collisions with vanilla and other mods. IDs should be unique and
stable because saved games and cross-event references may depend on them. Exact
grammar, numeric/string forms, namespace declaration, and collision behavior need
checking in 4.5.3.

**Proposed EPOCH architecture:** reserve one project prefix after confirming it
is unused, name IDs by arc and function, and maintain an ID registry. Example
names are not syntax claims.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files**.

## Event types and registration

**Older/community documentation, not verified:** Stellaris scripting has used
multiple event categories (including country- and planet-scoped event families)
and explicit invocation or hook-based activation. Available types, root scopes,
required fields, and activation semantics are version- and context-sensitive.
No speculative event block is provided.

**Proposed EPOCH architecture:** use the narrowest verified scope matching the
content. Activate events through a verified hook or explicit preceding event;
do not rely on accidental file loading or guessed registration conventions.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files** for types,
registration, required fields, and root-scope rules.

## `on_actions`

**Older/community documentation, not verified:** on_actions are named engine
callbacks that invoke scripted responses at lifecycle or gameplay hooks. Mods may
extend some callbacks, but hook names, merge/order behavior, and permissible scope
vary. Global callbacks can be expensive when their response repeatedly scans all
empires.

**Proposed EPOCH architecture:** identify one suitable verified initialization or
game-start callback for a single eligibility bootstrap. Use narrow callbacks
thereafter. Do not invent hook names, overwrite vanilla definitions, or assume
additive merge semantics until confirmed.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files**.

## Scopes and scope transitions

**Older/community documentation, not verified:** script scopes identify the object
on which a trigger/effect is evaluated (for example, an empire or planet); scope
transitions move evaluation to related objects. Legal root scopes and transitions
depend on calling context and command.

**Proposed EPOCH architecture:** document expected scope at every event/effect
boundary; keep discovery state on the empire; transition to a planet/system only
where needed; return explicitly to the intended root scope. Review every
transition in source and logs.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files** for scope
names, transition commands, and context-specific validity.

## Triggers and effects

**Older/community documentation, not verified:** triggers test conditions for
availability or applicability; effects change game state. Conditional blocks and
limits exist in some contexts, but grammar and valid commands vary. Trigger checks
may be reevaluated frequently depending on their use.

**Proposed EPOCH architecture:** centralize shared eligibility/progression gates;
keep effects idempotent; apply the same logical gates to AI and players. Avoid
costly iteration in frequently evaluated triggers. Check every command in its
actual root scope and context.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files**. No
script-syntax examples are asserted here.

## Scripted triggers and scripted effects

**Older/community documentation, not verified:** reusable named trigger/effect
definitions are commonly used to avoid duplicated logic. Their directory
placement, invocation form, parameter behavior, and permitted nesting must be
verified for the target release.

**Proposed EPOCH architecture:** factor shared eligibility and transitions only
after confirming conventions. Document expected caller scope and side effects;
avoid hidden scope dependencies.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files**.

## Country flags and variables

**Older/community documentation, not verified:** persistent per-country markers
and numeric values are used in Paradox scripting, but flags and variables differ
in type, lifetime, comparison, cleanup, and save behavior.

**Proposed EPOCH architecture:** persist a compact per-empire state machine for
scheduled, discovered, investigating, resolved, and recovery states. Select a
flag or variable only after verifying operations, persistence, reset, and save
compatibility. Repeated events must not duplicate outcomes.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files**.

## Event targets

**Older/community documentation, not verified:** named event targets can retain
references to scoped objects for later script use, but validity, scope, duration,
and persistence differ by target type and context.

**Proposed EPOCH architecture:** prefer persistent empire state over long-lived
object references. For any later planet/system target, define owner, lifetime,
invalidation path, and multiplayer/save behavior.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files**.

## Situations and situation stages

**Older/community documentation, not verified:** situation-style content can
represent ongoing progress with stages, values, and effects. Definitions, update
cadence, scope ownership, UI fields, and transitions must be checked for 4.5.3;
automatic performance cannot be assumed.

**Proposed EPOCH architecture:** use a situation for investigation only if its
verified player-facing progress model fits. Keep updates local and event-driven
where possible, and make stop/resolution behavior explicit.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files**.

## Special projects

**Older/community documentation, not verified:** special projects can provide a
player/AI task with costs, progress, and completion consequences, but definitions
and hooks depend on project type and version.

**Proposed EPOCH architecture:** use a project for investigation/response only
when an appropriate verified type exists. Confirm eligibility, completion scope,
abort behavior, costs, and AI handling. Do not assume archaeology and anomaly
interfaces are interchangeable with generic projects.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files**.

## Localisation format and encoding

**Older/community documentation, not verified:** Stellaris localisation uses
structured key/value files and language-specific folders; encoding, version
header, quoting, escaping, and tokens are parser-sensitive.

**Proposed EPOCH architecture:** maintain English and German entries for every
player-facing string, use stable prefixes, and validate both in game. Take exact
4.5.3 encoding and file conventions from vanilla examples.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files**, especially
encoding, header, and token rules. `.gitattributes` line-ending normalization
does not establish game-compatible encoding.

## AI weights and automation

**Older/community documentation, not verified:** scripted AI weights or automatic
choices have been used for mod content, but exact blocks, choice evaluation, and
safe fallbacks depend on content type and engine version.

**Proposed EPOCH architecture:** AI has no separate discovery eligibility. Every
decision that could stall progression needs a viable AI path using verified
weights or deterministic automatic resolution. Avoid free rewards or penalties
caused by missing AI behavior.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files**.

## Multiplayer and performance

**Older/community documentation, not verified:** synchronized script execution
and deterministic state/random changes are important for multiplayer consistency.
Repeated global or high-frequency iteration can add cost as galaxy size grows.
Exact synchronization guarantees and performance cannot be inferred from syntax.

**Proposed EPOCH architecture:** schedule each empire once, store state with that
empire, and advance through explicit events. Use only verified synchronized
randomization. Keep effects deterministic and idempotent; test host/client behavior
and measure representative empire counts. Avoid local clocks and client-only state.

**4.5.3 status:** **UNVERIFIED – requires Stellaris 4.5.3 game files and runtime
multiplayer/performance validation**.

## Verification checklist for M0-B

For each feature, locate a vanilla 4.5.3 example and containing file; record valid
root scope/call context; inspect load/merge behavior; build the smallest isolated
test mod; inspect parser/error logs; then test save/load, player and AI, and
host/client behavior where relevant. Keep vanilla facts separate from community
references and EPOCH design choices. An older guide or parse success in another
version does not verify a claim for 4.5.3.
