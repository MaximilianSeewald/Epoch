# ADR-001: A Single Galactic Nullwarden Crisis with Per-Empire History

> **Current contract, second playtest (2026-11-09):** The user tested `2c95edf` and authorized the connected fixes in [second-playtest implementation](../phases/stage-iii-second-playtest.md). Required victory: every registered anchor and the unique command ship destroyed in combat; surviving minor formations withdraw afterward and never gate victory. Five globally synchronized chapters remain. Science/diplomacy cannot replace military objectives. Earlier residual-fleet hunt and opening-only approval gates are superseded. New changes have static regression evidence; new native display, retreat and MP results remain unverified.


**Status: ACCEPTED — design decision, not implementation evidence.** Date: 2026-11-08. Applies to Stage III only. Supersedes the previous *country-local only / no galaxy-wide singleton* rule **for the global crisis lifecycle**, while preserving its ownership and independence constraints for Stages I/II and personal rewards.

## Context

Stages I and II are self-contained stories owned by individual countries. A country can decline them permanently. Their code explicitly avoids galaxy-global progress and foreign empire target reuse. The user now requires a true galactic midgame Nullwarden crisis: all spacefaring empires are affected, including never-participants and opt-outs; former participants may prepare 20 years early if Stage II is finished; uninformed empires suffer greater planetary harm. Building a separate crisis per country would yield duplicate galaxies of enemies, unfair difficulty and multiplayer desynchronization.

## Decision

**One global crisis lifecycle per galaxy; any number of independent country-local responses.**

1. A unique, save-persistent, idempotent galaxy crisis coordinator starts one outbreak near the *configured* Mid-Game Start Year. It exists even if no country completed Stages I/II. It creates a bounded shared enemy/anchor graph, not a fleet per participant.
2. Country-local eligibility for early preparation requires completed and explicitly continued Stage II. Individual opt-out continues to block personal investigation and future personal ascension; it **cannot** block global combat exposure, generic reports or planetary effects. This is a narrow, intentional exception to the previous meaning of permanent personal exit.
3. On the outbreak, every ordinary spacefaring empire is included whether or not it has the EPOCH campaign flags. Uninitiated countries face more severe initial effects; players who contain prior effects are not deprived of their achievements.
4. Combat, anchor shutdowns and victory are global facts; national research, defense, losses, contribution and eventual Stage-IV access remain owner-local. Attribution requires valid ship/fleet/system/planet identities and scope checks. No empire receives another empire's local reward.
5. A global result is not equivalent to a successful personal story. A nonparticipant can help save the galaxy without retroactively acquiring Stage-II flags, permanent consent or Stage-IV access.
6. The central coordinator must avoid duplication on save/load, host/client MP and game-rule timing. Native game scripting support for the coordinator and configured midgame offset is a hard proof gate, not an assumed engine feature.
7. Do not change any current Stage-I or Stage-II gameplay, invitation schedule or permanent consequences to achieve this. All new Stage-III objects have a separate namespace/schema.

## Explicit eligibility matrix

| Country state | Early preparation (P..M) | Global crisis at M | Generic defensive research after M | Personal Stage-IV entry |
|---|---|---|---|---|
| Stage II complete + explicitly Continue | Yes, by paid action | Yes | Yes | Eligible under later Stage-IV contract |
| Stage II complete but preparation not taken | Eligible only during available window | Yes; medium initial exposure | Yes | May remain eligible |
| Stage II incomplete / Stage I only | No | Yes; increased exposure | Yes | No automatic entitlement |
| Never engaged with EPOCH | No | Yes; increased exposure and real established feature effects | Yes | No automatic entitlement |
| Stage I/II permanently declined | No | Yes; increased exposure | Yes, generic public crisis layer only | No |
| Created after outbreak | Never retroactively | Enroll once into ongoing global phase | Yes | Based only on own explicit history |

Special country types get an explicit implementation matrix before activation (§2 of [spec](../phases/stage-iii-military-crisis.md)); they cannot be silently excluded from real galactic military effects or treated like ordinary colonies without evidence.

## Isolation and invariants

- `global_stage3_started`, `global_stage3_resolved`, global phase, and crisis-object identities are single authoritative records. Country fields do not start new copies.
- Each global object has at most one living canonical identity; recycling event targets cannot create a second live enemy. Deleted/missing targets trigger *safe investigation*, never success.
- A planetary feature is a physical state, not a country reward; current physical owner and feature family exclusivity are checked before modification.
- Authoritative simulation dispatch and relevant Vanilla hooks must be verified in installed 4.5.3 scripts. Do not assume an exposed host-only scripting command exists. Failing proof blocks implementation; arbitrary country-leading scans are not an acceptable MP coordinator (ADR-002 I05).
- Global crisis messages may reach a permanently opted-out empire; old personal investigations cannot re-open.
- Galaxy-wide victory does not heal Stage-I/II penalties, grant old research, or unlock ascension to nonparticipants.

## Considered alternatives

- **Separate crisis for each empire:** rejected — duplicate enemies, inconsistent territorial reality, impossible collective response and MP risk.
- **Only prior EPOCH participants targeted:** rejected — violates the universal-galaxy requirement.
- **Auto-complete Stages I/II for nonparticipants:** rejected — fabricates story choices, rewards and personal consent.
- **Ignore prior opt-out and force Stage-IV participation:** rejected — breaks a permanent personal decision. Only physical galactic consequences are universal.
- **Fixed 2280/2300 years:** rejected — ignores custom Mid-Game Start Year.

## Consequences and follow-up

This changes an earlier architectural assumption; all documentation and Stage-III testing must reflect the exception explicitly. Stage III requires both global lifecycle tests and independent owner-local progression tests. Codex must first prove relative timing and coordinated fleets using exact game version sources, then build the crisis incrementally on a new branch. No existing Stage-I/II file needs to be overridden merely to register the global threat.

## Integration refinements

[ADR-002](adr-002-stage-iii-integration.md) is part of this planning contract. Ordinary spacefaring empires include subjects; public exposure never bypasses protected/active world rules. M..M+1 is a safe-topology target, not a forced capital-spawn deadline. First initialization at/after M is outside automatic v1 save support. Strategic AI/MP and exact timing remain runtime gates; negative pre-M comparisons now have installed source evidence. Version 1 promises real fleet/installation pressure, not unproven ground occupation.
