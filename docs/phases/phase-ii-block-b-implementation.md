# Phase II Block B — Expansion implementation

Block B continues `epoch_resonance_protocol` from the saved `epoch_ii_handoff_ready` state. It preserves the existing approach and 0–100 resonance-stability variable; it does not create a second Phase II invitation or reset the Phase I contamination and capital-scar records. Chapter 7 is not implemented or started.

## Situation flow and durable outcomes

| Situation stage | Required player action / release flag | Stored result |
|---|---|---|
| Scar wakes (0–20) | Existing Block A | Existing chapter record |
| Scar report (20–30) | Existing Block A survey/report | `epoch_ii_ch1_resolved` |
| First Hunters (30–50) | Existing Block A military encounter | `epoch_ii_ch2_resolved`, combat/diversion/withdrawal details |
| Hunters resolution (50–60) | Existing Block A | `epoch_ii_ch2_resolved` |
| Broken Code (60–80) | Existing Block A analysis project | `epoch_ii_ch3_resolved` |
| Block A handoff (80–90) | Existing Block A result report | `epoch_ii_handoff_ready` |
| Chapter 4 research (90–100) | Choose quarantine, observation, or exploitation | `epoch_ii_quarantine_protocol`, `epoch_ii_observation_protocol`, or `epoch_ii_exploitation_protocol`; records Block A completion |
| Chapter 4 incidents (100–110) | Resolve anomaly, coordination disruption, and contamination breakthrough | `epoch_ii_ch4_resolved`, incident/protocol flags and cost/result flags |
| Chapter 5 research (110–120) | Choose listening array, mobile, or paired survey posture | Posture flags; paired posture offers Phased Sensors for normal research |
| Chapter 5 expedition (120–130) | Finish two staffed Science Ship projects in distinct accessible systems, or pay for archive analysis | `epoch_ii_two_real_systems_surveyed` or lower-yield archive record |
| Chapter 5 silence (130–140) | Finish the silent-system Science Ship project and choose dark/repeat/broadcast | `epoch_ii_silent_system_dark`, `_repeated`, or `_broadcast`; broadcast sets `epoch_ii_network_exposed` |
| Chapter 6 preparation (140–150) | Receive normal research options and inspect the approaching force | `epoch_ii_ch6_research_done` |
| Chapter 6 encounter (150–170) | Destroy the force, finish a staffed trap/science project, or withdraw | `epoch_ii_ch6_resolved`, route-specific result, node state and convergence-data quality |

All stages share one monotonic Situation, so the Block A approach and stability survive the handoff. Situation progress stops at each unresolved action. The final Situation completion sets `epoch_ii_block_b_complete`; the player-facing report prepares `epoch_ii_handoff_block_c_ready` without creating Block C content.

## Planet mechanics and laboratory

Four visible deposits pair with durable planet modifiers: Latent / Echo Scar, Active / Resonant Scar, Unstable / Fractured Resonance, and Controlled / Bound Resonance. State changes remove only the prior Phase II state. They do not remove the Phase I deposits or permanent modifiers. Economic and stability effects range from modest research at Latent to stronger research with production/stability loss at Unstable; Controlled improves research, output, and stability.

The three Chapter 4 incidents have distinct response effects. The breakthrough offers a permanent local job-output sacrifice, paid security and recovery, or a high-risk research experiment. A further owned world receives resonance only through the explicit 500-energy transfer decision; no galaxy-wide spread runs automatically. If that world is not available, the option is disabled.

The Resonance Laboratory unlocks after Chapter 3, requires Resonance Spectroscopy, has a one-per-planet limit, a 600-mineral build cost, and 5 energy plus 1 rare-crystal monthly upkeep. It adds Physics research outside Situation progress. Its triggered modifiers respond to each of the four saved world states; unstable operation gives the most research with a stability penalty. It remains useful after the Situation ends.

## Expedition sites, research, and combat

The two node systems are selected at run time from distinct systems reachable by the empire. Each is a real galaxy-system Special Project requiring a Science Ship and scientist. The silent-site selector searches from the first node for a distinct reachable system containing a non-colonizable barren planet and runs its own staffed project there. Missing systems or failed/cancelled projects open a paid, lower-yield archive route. Project callbacks record results only after completion.

The silent-system result records the null boundary, old cancellation grooves, a one-heartbeat return matching the Phase I archive, and uncertainty about authorship. The three choices produce different stability, research, or exposure results. The result does not establish who made the grooves or why.

Adaptive Resonance Armor remains available from Block A through a normal engineering research option. Phased Sensors is a normal physics research option with Resonance Spectroscopy and Sensors II prerequisites; its component is usable in ship designs. Neither technology is granted for free. The Resonance Laboratory is a normal building, not a technology reward.

Chapter 6 creates a real hostile fleet in the saved target system. It starts with four armed corvettes, adds two when the first force was destroyed, adds heavy disruptor destroyers after a prior diversion and when the empire has Destroyers, and uses the saved broadcast outcome for alert narrative/exposure. Direct combat resolves only when the saved fleet disappears. The trap and scientific countermeasure are separate staffed projects with costs and distinct data/stability results. Withdrawal records a lost node and lower-quality data; it clears orders and de-escalates but never destroys a surviving fleet.

## Test and runtime limits

The new source-driven Block B model exercises stage order, mandatory chapter gates, class/state transitions, the explicit second-world route, distinct project targets, archive fallbacks, technology prerequisites, fleet creation, combat wait, four encounter routes, durable outcomes, and German/English key presence. `test_epoch_regressions.ps1` runs this alongside Phase I and Block A regressions.

These checks do not parse scripts with the Stellaris engine or validate UI, actual project dispatch/pathfinding, fleet combat, save/load, multiplayer, or AI execution. No game was launched and no in-game test was performed. The installed 4.5.3 source was used to check Situation, building, project, system-query, component, and destroyer-section patterns. The repository fetch could not update `.git/FETCH_HEAD` because `.git` is read-only in this workspace; local `origin/main` already points to the PR #8 merge base. Branch publishing therefore remains dependent on restoring Git metadata write access.
