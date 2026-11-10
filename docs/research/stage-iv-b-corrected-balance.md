# Package B: staffed balance ledger — 2026-11-10

Installed Cygnus 4.5.3 sources, hashed in the JSON. 100 workforce = one economic job unit. Full staffing; no species traits, designations, empire bonuses, deposits or civics except the explicitly labelled catalytic/machine variants. Organic net includes building upkeep and job inputs. Own direct unity/technician modifiers are included; stability/happiness feedback, population living standards, housing, opportunity cost and unrelated colony output are excluded, not silently zeroed. Native gameplay remains unverified.

| Family | Installed native comparison | Metric / scenario | Vanilla | EPOCH top | Ratio |
|---|---|---|---:|---:|---:|
| lab | building_research_lab_3 | research / field | 5.4 | 9.72 | 1.8 |
| forge | building_foundry_3 | organic alloys | 18 | 36 | 2 |
| collector | building_energy_nexus | local energy / 100 technician workforce | 1 | 2 | 2 |
| institute | building_medical_2 | amenities (base doctors, no civic/trait) | 1500 | 2700 | 1.8 |
| archive | building_bureaucratic_3 | unity on 20 staffed bureaucrat units, with building workforce bonus; EPOCH + 4 archivists | 66 | 105.8 | 1.603 |
| phase | building_planetary_shield_generator | effective bombardment endurance, equal planet | 2 | 4 | 2 |
| academy | building_fortress | naval cap, four units; Vanilla includes Ground Defense Planning | 20 | 40 | 2 |
| factory | building_crystal_plant_2 / strategic refinery | distinct strategic outputs, no interchangeable unit value | not comparable | 72 | N/A |

The archive comparison is a fixed 20-bureaucrat colony, not a claim that the administrative building has 20 intrinsic jobs. The EPOCH institute also supplies society research, unity and local stability; it does not reproduce native doctor growth. The collector includes 35/72 direct energy before building upkeep, on top of the local technician bonus. The phase comparison is damage endurance, not an added 100% bombardment reduction. Factories create an EPOCH-only resource: no honest numeric Vanilla exchange-rate comparison exists. Fallen-Empire sources were inspected; their restricted automated resource buildings are not normal staffed comparators.

| Organic building | Workforce units | Gross output | Monthly net, including inputs/building upkeep |
|---|---:|---|---|
| building_epoch_lab_1 | 1.8 | physics_research +3.24; society_research +3.24; engineering_research +3.24 | physics_research +3.24; society_research +3.24; engineering_research +3.24; epoch_protocol_cores -2.18; consumer_goods -2.7; energy -4 |
| building_epoch_lab_2 | 3.6 | physics_research +6.48; society_research +6.48; engineering_research +6.48 | physics_research +6.48; society_research +6.48; engineering_research +6.48; epoch_protocol_cores -4.36; consumer_goods -5.4; energy -8; exotic_gases -1 |
| building_epoch_lab_3 | 5.4 | physics_research +9.72; society_research +9.72; engineering_research +9.72 | physics_research +9.72; society_research +9.72; engineering_research +9.72; epoch_protocol_cores -6.54; consumer_goods -8.1; energy -12; exotic_gases -2 |
| building_epoch_forge_1 | 2 | alloys +12 | alloys +12; epoch_protocol_cores -2.1; energy -4 |
| building_epoch_forge_2 | 4 | alloys +24 | alloys +24; epoch_protocol_cores -4.2; energy -8 |
| building_epoch_forge_3 | 6 | alloys +36 | alloys +36; epoch_protocol_cores -6.3; energy -12 |
| building_epoch_collector_1 | 2 | energy +35 | energy +31; minerals -4; epoch_protocol_cores -1.6 |
| building_epoch_collector_2 | 4 | energy +64 | energy +56; minerals -8; epoch_protocol_cores -3.2 |
| building_epoch_institute_1 | 1 | society_research +4; unity +3 | society_research +4; unity +3; epoch_protocol_cores -1.05; consumer_goods -1.5; energy -4 |
| building_epoch_institute_2 | 2 | society_research +8; unity +6 | society_research +8; unity +6; epoch_protocol_cores -2.1; consumer_goods -3; energy -8 |
| building_epoch_archive_1 | 2 | unity +17.6; physics_research +2 | unity +17.6; physics_research +2; epoch_protocol_cores -1.6; consumer_goods -3; energy -4 |
| building_epoch_archive_2 | 4 | unity +36.8; physics_research +4 | unity +36.8; physics_research +4; epoch_protocol_cores -3.2; consumer_goods -6; energy -8 |
| building_epoch_phase_1 | 1 |  | energy -6; epoch_protocol_cores -1.05 |
| building_epoch_phase_2 | 2 |  | energy -12; epoch_protocol_cores -2.1 |
| building_epoch_factory_1 | 3 | epoch_protocol_cores +36 | epoch_protocol_cores +36; minerals -54; alloys -9; energy -28 |
| building_epoch_factory_2 | 6 | epoch_protocol_cores +72 | epoch_protocol_cores +72; minerals -108; alloys -18; energy -56 |
| building_epoch_academy_1 | 2 | unity +2 | unity +2; energy -8; alloys -1; epoch_protocol_cores -1.6 |
| building_epoch_academy_2 | 4 | unity +4 | unity +4; energy -16; alloys -2; epoch_protocol_cores -3.2 |

Intermediate tiers are paid expansions, not additional empire multipliers. Forge output is 12/24/36 alloys, with 20/40/60 mineral job inputs. Catalytic and Machine branches remain explicit; full ledgers for those and Hive are in JSON. A +50% common output modifier gives top lab 14.58 per field, Vanilla 8.10; forge 54 vs 27 alloys (inputs unchanged); the relative advantage remains 1.8×/2×.

Third-playtest production and higher upkeep supersede the previous core scenario figures. Current signed small/medium/large balances, bootstrap assumptions and native deficit behavior: [current core ledger](third-b-c-playtest-2026-11-10/core-economy.md). Zero staffing produces zero modeled cores; actual factory production awaits a controlled engine check. Core ship purchase cost is 325 per reference battleship; ordinary hull/alloy maintenance is additional.

Wilderness has no jobs: paid network fabrication supplies 36/72 per node, at 108/216 minerals, 18/36 alloys and 56/112 energy monthly. Nodes scale 1–6 at 1/5/10/15/20/25 colonies. Costs, inputs and output share the same multiplier; maximum throughput is 432, not infinite. This intentionally charges twice the staffed inputs for saved labor. Integration and philosophy edicts retain their additional upkeep. Mega-forge outputs and UAP upkeep are accounted in the Package-C report.
