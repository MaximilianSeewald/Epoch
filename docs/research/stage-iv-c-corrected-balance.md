# Package C: native comparisons and bounded ascension audit — 2026-11-10

Third player test: production on the input commit failed. The [production correction](../phases/stage-iv-production-correction.md) supersedes previous scope assumptions; current production is still not runtime-validated. All values come from the checked-in scripts and actually installed 4.5.3 files; source hashes and all 28 before/after choices, five perks and ten stage resource tables are in JSON. This is a design ledger, not measured gameplay.

| EPOCH tree / perk | Revised core benefit | Installed native comparison and tradeoff |
|---|---|---|
| Legacy | 10% research, 25% mega speed, 15% unity, -15% building cost, +2 research options, +5 stability, +50 naval cap | Discovery finish: 10% research; Supremacy adopt: +20 naval cap / +20% army damage. Legacy is earned late and costs a whole tree; it does not grant Master Builders’ extra construction slot. |
| Symbiosis | 25% combined habitability, -25% building time, -25% army damage taken, +15% growth, +10% happiness, +2 biological/lithoid trait points | Harmony adopt: -10% pop upkeep; finish +25% planetary ascension effect. EPOCH specializes in growth/adaptation, keeps organic-only gate and paid gene modification. |
| Convergence | 10% unity, 10% job output, +5 stability, 20,000 storage, -20% terraforming cost, +10% habitability, +5% fire rate | Synchronicity collective reasoning: +3 stability / -10% ascension cost. Wilderness replaces job output with 20% mega speed and stability with -25% building time; it does not receive useless drone output. |
| Network | 10% assembly, -10% job upkeep, 10% research, -25% building time, +5 stability, -10% ship upkeep, +2 robot/machine trait points | Versatility finish: +10% assembly with added assembler upkeep; material analysis: -5% job upkeep. EPOCH doubles that efficiency effect but requires the earned class tree. |
| Living Convergence | 10% bonus workforce, +2 trait points/picks, existing paid organic traits and Symbiotic World decision | Native World Shaper / Hive Worlds are world-conversion unlocks, not free global workforce. EPOCH retains class and tech gates, consumes a slot and paid modification costs; no forced conversion. |
| Hive Sovereignty | 10% job output (Wilderness: 25% mega speed), +60 naval cap, +2 trait points/picks | Native Hive Worlds unlocks hive terraforming; Master Builders gives +50% mega speed and a build slot. The Wilderness perk provides half that speed plus class traits/naval capacity, without an extra slot. |
| Sovereign Protocol | 15% assembly, +5% fire rate, +2 trait points/picks and existing paid machine traits | Versatility’s whole-tree finish gives +10% assembly; Machine Worlds is a terraforming unlock. EPOCH adds a distinct machine specialization and retains native modification access. |
| Heir to the Nullwardens | +200 naval cap, +20% home-territory fire rate, +10% ship upkeep, existing Protocol-Imprinted access | Galactic Force Projection: +150 naval cap, +20% command limit, +1 commander, +2 power-projection influence. EPOCH pays upkeep and gives home defense instead of command/influence; mutually exclusive with Free. |
| Free Convergence | 10% research, -25% terraforming cost, -5% job upkeep, existing Protocol-Imprinted access and paid interface healing | Installed Technological Ascendancy gives +50% rare-tech draw chance, not the obsolete +10% research commonly quoted. Free provides reliable research/economic benefits after the full story; no combat bonus, no conversion bypass. |

Stack limits: at most Legacy + one class tree + one class perk + one philosophy perk. Class and philosophy gates exactly equal the playtested commit. New C research totals at most 30 percentage points (Legacy 10 + Machine tree 10 + Free perk 10), plus one capped Free UAP (10). These are additive to pre-existing bonuses; no repeatable reward or recursive multiplier. Organic growth from the tree is capped at 15 points. Job output for a Hive is capped at 20 points from C tree+perk; Wilderness replaces both job bonuses. Ship upkeep reductions cap at 10 points from Network plus existing other content; Guardian explicitly adds 10 points of cost. One normal finisher perk slot per selected tree; native seven-tree/eight-perk limits stay unchanged.

| Structure stage | Cost | Upkeep | Conditional native monthly output |
|---|---|---|---|
| epoch_nexus_1 | unity 2000; alloys 6000; epoch_protocol_cores 200 | energy 40; epoch_protocol_cores 2 | physics_research 200; society_research 200; engineering_research 200; epoch_protocol_cores 4 |
| epoch_nexus_2 | unity 4000; alloys 12000; epoch_protocol_cores 400 | energy 80; epoch_protocol_cores 4 | physics_research 400; society_research 400; engineering_research 400; epoch_protocol_cores 8 |
| epoch_nexus_3 | unity 6000; alloys 18000; epoch_protocol_cores 600 | energy 120; epoch_protocol_cores 6 | physics_research 600; society_research 600; engineering_research 600; epoch_protocol_cores 12 |
| epoch_forge_1 | unity 2000; alloys 6000; epoch_protocol_cores 200 | energy 60; minerals 400 | alloys 100; epoch_protocol_cores 20 |
| epoch_forge_2 | unity 4000; alloys 12000; epoch_protocol_cores 400 | energy 120; minerals 800 | alloys 200; epoch_protocol_cores 40 |
| epoch_forge_3 | unity 6000; alloys 18000; epoch_protocol_cores 600 | energy 180; minerals 1200 | alloys 300; epoch_protocol_cores 60 |
| epoch_uap_1 | unity 2000; alloys 10000; epoch_protocol_cores 600 | energy 100; epoch_protocol_cores 10 | alloys 30 OR philosophy: physics_research 150; society_research 150; engineering_research 150; unity 20 |
| epoch_uap_2 | unity 4000; alloys 20000; epoch_protocol_cores 1200 | energy 200; epoch_protocol_cores 20 | alloys 60 OR philosophy: physics_research 300; society_research 300; engineering_research 300; unity 40 |
| epoch_uap_3 | unity 6000; alloys 30000; epoch_protocol_cores 1800 | energy 300; epoch_protocol_cores 30 | alloys 90 OR philosophy: physics_research 450; society_research 450; engineering_research 450; unity 60 |
| epoch_uap_4 | unity 8000; alloys 40000; epoch_protocol_cores 2400 | energy 400; epoch_protocol_cores 40 | alloys 120 OR philosophy: physics_research 600; society_research 600; engineering_research 600; unity 80 |

Nexus III supplies 600 research per field versus native Science Nexus IV’s 350 (1.714×), at 120 energy / 6 cores upkeep, 12 gross cores and higher construction investment. Free UAP IV supplies 600/field +80 unity, +10% research and -20% terraforming cost at 400 energy /40 cores. Guardian UAP IV supplies +240 naval cap and +20% home fire rate plus 120 alloys; native Coordination Center III provides +150 naval cap plus its other logistics bonuses. EPOCH omits those native logistical functions and costs cores. Forge III pays 1,200 minerals /180 energy for 300 alloys +60 cores; a native Matter Decompressor supplies minerals instead, so its 2,000-mineral output is not a fungible alloy comparison. Forge is a later labor-saving conversion investment, not free energy or minerals.

Infrastructure scenario: Forge III + Nexus III + UAP IV nets +26 cores, -700 energy, -1,200 minerals, +300 alloys (Free) or +420 alloys (Guardian), before other colony/ship loads. The third-test building upkeep correction changes the combined empire balance; see [current signed core ledger](third-b-c-playtest-2026-11-10/core-economy.md). Construction is a separate stockpile payment. A core deficit suspends Nexus/UAP output; mineral/energy deficits suspend Forge output. Completed duplicate Nexus/UAP ownership suspends that family’s output/modifiers until dismantling removes surplus.

Observed lifecycle fixes and remaining risks: owner/count gates are live, so completed conquest changes output without copying former-owner country flags. Recurring produces run in megastructure scope, as directly observed in the third player log. Country predicates use the native optional owner? link; recurring resource queries contain no root instance flag, since older logs also show country-only queries. Native stage completion controls economic activation. Completion flags remain in correctly scoped infrastructure access and country modifier checks. Triggered country modifier conditions run in country scope and search operational instance flags through any_owned_megastructure. The earlier reversed scope oracle is superseded. The build picker excludes existing/constructing capped families; possible checks completed flagged structures only so an unfinished shell does not cancel itself. Native construction capacity plus the picker handles ordinary concurrency; queued simultaneous orders with extra native build capacity still need the smoke test. Dismantle cleanup refuses to release planets still hosting a megastructure; callback removal order needs native confirmation. No production, upgrade or owner-transfer success is claimed without fresh game evidence.

## Every tradition choice

| Choice | Before | After | Wilderness replacement |
|---|---|---|---|
| tr_epoch_legacy_adopt | all_technology_research_speed 0.05 | all_technology_research_speed 0.1 |  |
| tr_epoch_legacy_finish | megastructure_build_speed_mult 0.1; ascension_perks_add 1 | megastructure_build_speed_mult 0.25; ascension_perks_add 1 |  |
| tr_epoch_legacy_chronicles | country_unity_produces_mult 0.1 | country_unity_produces_mult 0.15 |  |
| tr_epoch_legacy_reconstruction | planet_buildings_cost_mult -0.1 | planet_buildings_cost_mult -0.15 |  |
| tr_epoch_legacy_discipline | num_tech_alternatives_add 1 | num_tech_alternatives_add 2 |  |
| tr_epoch_legacy_harmonization | planet_stability_add 3 | planet_stability_add 5 |  |
| tr_epoch_legacy_wardens | country_naval_cap_add 30 | country_naval_cap_add 50 |  |
| tr_epoch_symbiosis_adopt | pop_environment_tolerance 0.05 | pop_environment_tolerance 0.1 |  |
| tr_epoch_symbiosis_finish | BIOLOGICAL_species_trait_points_add 1; LITHOID_species_trait_points_add 1; ascension_perks_add 1 | BIOLOGICAL_species_trait_points_add 2; LITHOID_species_trait_points_add 2; ascension_perks_add 1 |  |
| tr_epoch_symbiosis_adaptation | pop_environment_tolerance 0.1 | pop_environment_tolerance 0.15 |  |
| tr_epoch_symbiosis_architecture | building_time_mult -0.15 | building_time_mult -0.25 |  |
| tr_epoch_symbiosis_regeneration | army_damage_taken_mult -0.15 | army_damage_taken_mult -0.25 |  |
| tr_epoch_symbiosis_evolution | logistic_growth_mult 0.05 | logistic_growth_mult 0.15 |  |
| tr_epoch_symbiosis_sovereignty | pop_happiness 0.05 | pop_happiness 0.1 |  |
| tr_epoch_convergence_adopt | country_unity_produces_mult 0.05 | country_unity_produces_mult 0.1 |  |
| tr_epoch_convergence_finish | BIOLOGICAL_species_trait_points_add 1; LITHOID_species_trait_points_add 1; ascension_perks_add 1 | BIOLOGICAL_species_trait_points_add 2; LITHOID_species_trait_points_add 2; ascension_perks_add 1 |  |
| tr_epoch_convergence_expansion | country_resource_max_add 10000 | country_resource_max_add 20000 |  |
| tr_epoch_convergence_drones | planet_jobs_produces_mult 0.05 | planet_jobs_produces_mult 0.1 | megastructure_build_speed_mult 0.2 |
| tr_epoch_convergence_nodes | planet_stability_add 5 | planet_stability_add 5 | building_time_mult -0.25 |
| tr_epoch_convergence_adaptation | pop_environment_tolerance 0.1; terraforming_cost_mult -0.1 | pop_environment_tolerance 0.1; terraforming_cost_mult -0.2 |  |
| tr_epoch_convergence_consciousness | ship_fire_rate_mult 0.05 | ship_fire_rate_mult 0.05 |  |
| tr_epoch_network_adopt | planet_pop_assembly_mult 0.05 | planet_pop_assembly_mult 0.1 |  |
| tr_epoch_network_finish | ROBOT_species_trait_points_add 1; MACHINE_species_trait_points_add 1; ascension_perks_add 1 | ROBOT_species_trait_points_add 2; MACHINE_species_trait_points_add 2; ascension_perks_add 1 |  |
| tr_epoch_network_correction | planet_jobs_upkeep_mult -0.05 | planet_jobs_upkeep_mult -0.1 |  |
| tr_epoch_network_intelligence | all_technology_research_speed 0.05 | all_technology_research_speed 0.1 |  |
| tr_epoch_network_architecture | building_time_mult -0.15 | building_time_mult -0.25 |  |
| tr_epoch_network_independence | planet_stability_add 5 | planet_stability_add 5 |  |
| tr_epoch_network_sovereignty | ships_upkeep_mult -0.05 | ships_upkeep_mult -0.1 |  |
