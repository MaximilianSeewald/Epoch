# Echoes of the Past

**Status: Implemented in PR #32; static checks are recorded in the PR. In-game, AI, save/load, and multiplayer behavior remain unverified.**

Echoes adds three optional side stories to the existing EPOCH mod. It does not add a campaign stage, origin, civic, free bonus, or global crisis trigger. Stories can appear during an active early EPOCH inquiry for organic empires, Hive Minds, and Machine Intelligences. Their flags and targets are local to each empire.

## Discoveries

| Story | What happens | Choices and result |
|---|---|---|
| **The Ghost Signal** | Surveying a reachable system can reveal a signal and a derelict research ship. A staffed Science Ship traces it and investigates the wreck. | Careful recovery takes longer. Forced recovery costs 250 energy and 100 alloys, completes sooner, and can require another staffed project to stabilize the archive. Completion grants bounded research and a temporary Physics insight modifier. |
| **The Unquiet Colony** | A separate survey roll can affect an eligible owned colony with a visible, time-limited production penalty. Colonies already carrying EPOCH contamination or structure states are excluded. | Containment, research, or risky exploitation are paid native decisions. Exploitation can grant resources and a temporary local bonus, or cause a backlash that can be repaired with another paid decision. Organic, Hive, and Machine colonies use separate modifiers. |
| **The Last Relay** | After the Ghost Signal or colony story resolves, a point of interest reveals an old relay in the surveyed system. A staffed Science Ship investigates it. | The empire can fight the spawned defender fleet, or complete a technical Science Ship project. Earlier story outcomes can shorten that project. The secured relay can be powered for limited sensor and research benefits, salvaged, or left deactivated. |

## Boundaries and recovery

- Discoveries are independent, optional, and bounded to the early inquiry. A permanent campaign opt-out cleans up active work and closes the side-story chain.
- Existing Stage-II Resonance planet states are never replaced by the colony story. The stories do not write Stage-III readiness, alter the public crisis entry condition, or affect other empires' progress.
- Science work requires a staffed Science Ship at the assigned location. A stale or reassigned project cannot complete against a different target.
- The relay defense is a real spawned fleet and combat encounter. A technical route remains available; a scripted event does not grant a fake military victory.
- Annual recovery is bounded. A lost or interrupted story can be cleaned up or reissued under its guarded owner-local state; it does not grant rewards for missing work.

## Acceptance evidence

The focused static regression is `node scripts/test_epoch_echoes.cjs`; the release regression includes it. The connected in-game acceptance should cover each discovery, both recovery approaches, relay combat and technical routes, all three empire classes for colony effects, permanent opt-out cleanup, and two empires progressing independently. Until those game sessions are recorded, source checks are not runtime validation.
