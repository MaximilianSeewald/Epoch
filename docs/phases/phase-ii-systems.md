# Phase II: Gameplay systems and Resonance Protocol

**Status:** binding design companion to [the campaign specification](phase-ii-resonance.md). All values below are relative balancing targets, not implementation or engine claims.

## Resonance Protocol

One empire-local situation guides the eight chapters without replacing their events, projects, or player actions. Each chapter is a guarded stage with explicit entry evidence, required player action and recorded outcome. Research progress unlocks analysis gates; it never automatically completes a chapter or starts the next one. The player may wait between actions, but waiting alone does not resolve an objective. Permanent closure or a deliberate chapter refusal ends active dispatches cleanly.

**Research progress** represents how well the empire interprets the pattern. Chapter-specific thresholds are set in the content balance sheet; reaching a threshold enables an analysis decision or project, not an automatic transition. A completed Special Project, battle resolution, site action or explicit choice is still required.

**Resonance Stability** is an empire-local 0–100 design scale, starting at 60 at Chapter 1. It measures the empire's ability to keep the original contamination site's response bounded, not the planet's general happiness or the capital's conclusion scar. Show four bands: 70–100 Contained, 40–69 Strained, 20–39 Unsteady, 0–19 Critical. Each consequential choice/event adjusts it by a modest bounded amount; no single random incident may decide the campaign. At low stability, incidents, costs and risks rise and safe options become more attractive. Every chapter still has a recovery action (pay resources/research, complete a stabilizing project, evacuate and study remotely, or accept a permanent site consequence). Raising stability never erases either Phase I result.

**Situation approaches** are selectable when the chapter offers an analysis or response posture. A posture sets trade-offs and can be changed at the next chapter boundary, usually with a small cost; it cannot bypass required chapter evidence.

| Approach | Research | Cost | Planet and stability | Risk and lasting tendency |
|---|---|---|---|---|
| Controlled Analysis | Steady, best quality of evidence | Moderate science and upkeep | Protects stability and reduces incident severity | Fewer immediate military advantages; unlocks safeguards and cleaner chamber choices |
| Intensive Research | Fastest progress and extra component/clue yield | High science, energy and specialist capacity | Strains local stability; lab incidents more likely | Better technology timing, greater instability and more demanding final safeguards |
| Suppress Resonance | Slowest research; preserves only safe evidence | Alloys/energy and continuing defensive attention | Strong immediate stability recovery and reduced local incidents | May obscure clues and invite Nullwarden scrutiny; opens controlled ending without full activation |
| Exploit Resonance | Burst progress and tactical insight | High energy/material cost; later maintenance | Lowers stability and risks spread or planetary disruption | Strong strategic rewards and unique outward-turn option; adds obligations and worsens chamber failure consequences |

No approach is a lockout. Low stability can be recovered or carried into a costly resolution. Research never substitutes for the military or expedition decisions the player must make.

## Planetary Resonance Features

Phase I's two records are represented as connected but distinct Planet Feature outcomes. The **contamination-site feature** belongs to the world where First Contamination occurred and describes its actual Phase I result and severity (including containment, worsening or spread, as applicable). The **conclusion-scar feature** belongs to the capital on which Phase I placed its permanent class-specific negative effect. Each keeps its original gameplay consequence and class expression when presented as a feature. They may be expressed together on one world only if their saved locations are the same; otherwise they remain on their respective worlds. If a surviving world changes hands, its feature and planet-bound consequence stay with that world; the original empire's campaign history remains attached to that empire, which does not regain ownership or receive a duplicate feature elsewhere. If a world is destroyed or otherwise no longer exists, preserve the outcome and consequence in the empire's record and use surviving records, samples or an explicitly established remote site for Phase II play. Do not remove or silently relocate the original consequence, or create it on a different planet merely to keep the narrative convenient. State transitions below apply to the contamination site; the capital feature remains the permanent conclusion scar and may receive a separate scar-state description only when a chapter explicitly affects it.

| State / in-game name | Meaning and effect | Decisions | Transitions and permanence |
|---|---|---|---|
| **Latent — Echo Scar** | The contamination site is quiet but remains in its actual Phase I outcome. Its own Phase I effect, if any, persists; rare, low-impact clues. The capital's separate permanent conclusion penalty is unchanged. | Preserve untouched, survey remotely, or establish a perimeter. | Entry default after the delay or after suppression. Local events/experiments can activate it. Neither site result nor capital penalty is cleared. |
| **Active — Resonant Scar** | The contamination site answers the signal. Its Phase I result remains; resonance adds modest research opportunity and recurring incidents that can tax stability or local output. | Listen, quarantine, or suppress; build lab or use remote analysis. | Chapter 1 changes Latent to Active. Further exposure may destabilize; deliberate control may suppress. Feature records location/origin and prior result. |
| **Unstable — Fractured Resonance** | The contamination site's pattern exceeds control. Existing site consequences remain and are joined by short-term incidents, disruptions or risk to that world. | Evacuate, emergency suppress, risky intensive study, or accept local loss for data. | Triggered by cumulative reckless choices, major failures or extreme instability, not a single dice roll. Can recover to Active or Controlled, but leaves a permanent local fracture/repair scar. |
| **Controlled — Bound Resonance** | The contamination site's signal is damped, partitioned or bounded, not cured. Its Phase I outcome persists; incident burden falls and a modest upkeep or monitoring cost applies. The capital's permanent conclusion penalty also remains. Ending-specific descriptions such as “with channel” or “redirected” are recorded as outcomes within this state system, not additional resonance states. | Maintain, cautiously study, or fully seal the local expression. | Reached by suppression, containment, or ending choice. Exploitation/major failure can return it to Active/Unstable. Its scar remains as a muted/altered feature permanently. A collapsed chamber leaves a lasting ruin/fracture consequence at the contamination site when it exists, without creating a fifth state or clearing the capital scar. |

Organics express the contamination-site feature through ecological disruption and community health; hives through drone coordination, sensory load and brood environments; machines through memory reliability, thermal/power routing or clock integrity. The capital conclusion feature retains the existing Phase I class-specific economic loss. Give each appropriate class-specific favorable research leverage where relevant, but do not offset or cancel either original Phase I consequence. Controlled does not mean harmless or resolved.

## Connected mechanics

### Resonance Laboratory

A new planetary research building becomes available after Chapter 3 analysis. It provides useful physics/society/engineering analysis selected by player posture, at a moderate recurring energy/upkeep and specialist/job opportunity cost. At the accessible contamination site it adds progress and enables a stabilizing experiment; there is an incident risk tied to state (small in Latent/Controlled, meaningful in Active, severe but telegraphed in Unstable). If that site is unavailable, a substitute accessible world or mobile/remote study can provide the building's campaign function at lower efficiency. It is not mandatory. Removing it stops its benefit but does not remove either feature.

### Planetary incidents

Incidents are short, state-appropriate dilemmas rather than flavor-only popups. Each offers at least two meaningful responses and records the state/outcome. Examples: synchronized sleep/clock cycle (protect populations/processes or record it); a resonance cavity opens (seal, sample, or exploit); quarantine breaks down (evacuate, spend to contain, or allow controlled exposure). Outcomes may move stability, incur temporary local disruption, cost research/resources, alter severity, or unlock a clue. No incident silently deletes a world or makes the campaign impossible.

### Interstellar Resonance Search

Chapters 5–6 require actual exploration of multiple distinct systems. A science ship and scientist undertake survey/listening projects at a delayed reflection and silent node; a third optional node offers extra evidence. Sites may be hostile, inaccessible or lost; each has a clearly described remote/archive substitute with lower yield and higher cost. A found system is saved as a clue and affects the chamber plan; no galaxy-wide meter alone counts as discovery.

### Hostile wreck analysis

After a battle, recovery gives components, weapon behavior and a technology lead, scaled by wreck condition. Retreat, defeat or inaccessible debris can use an intercepted signal or remote telemetry; this yields pattern evidence but no physical component and costs more research. Destruction, capture and study have different risks and later knowledge. No technology is granted free: story events expose a research option with normal research investment.

### Resonance Chamber operation

Chapter 7 uses a multi-decision operation: select a foundation; commit power/materials and research capacity; choose the safety or reach protocol; then complete an explicit activation or sealing project. Resonance Field Control is unlocked for normal research at the start of this preparation, so it can support the subsequent operation. It is never granted for free or required: without it, commit additional research/materials to a single-use safety array, scale down to observation, or accept a higher-risk operation. Each choice has a visible benefit, risk and stability consequence. A paused operation retains completed preparations. The player can resume, scale down to observation, or abandon and seal. Low stability increases price and persistent damage but never removes all routes.

## Chapter transitions and recovery

The protocol records required clue, key choice, stability band at decision time and outcome for each chapter. Threshold gates provide only eligibility. Required player actions include choosing an approach, completing projects, resolving or avoiding encounters through an explicit route, charting sites, and selecting an ending. Loss records a changed route; it never fabricates a win. Missing objects prompt a player decision between replacement investigation, remote study and closure. An empire that permanently exits receives no active campaign object later.

