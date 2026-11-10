# Third-playtest core economy correction

**Production is NOT runtime-validated on the correction commits.** These are arithmetic projections of actual resource tables and staffed job slots. Tooltip effects are never read as output. Costs include fixed building upkeep, all separate job upkeep tables, the reference ship components, starbases and one philosophy edict. Bonuses, living standards and ordinary hull upkeep are outside the core-only projection. The earlier first-upkeep-only helper missed Forge job core upkeep; this ledger sums every upkeep table.

| Building | Fixed cores/month | Staffed-job cores/month | Total |
|---|---:|---:|---:|
| building_epoch_lab_1 | 2 | 0.18 | 2.18 |
| building_epoch_lab_2 | 4 | 0.36 | 4.36 |
| building_epoch_lab_3 | 6 | 0.54 | 6.54 |
| building_epoch_forge_1 | 2 | 0.1 | 2.1 |
| building_epoch_forge_2 | 4 | 0.2 | 4.2 |
| building_epoch_forge_3 | 6 | 0.3 | 6.3 |
| building_epoch_collector_1 | 1.5 | 0.1 | 1.6 |
| building_epoch_collector_2 | 3 | 0.2 | 3.2 |
| building_epoch_institute_1 | 1 | 0.05 | 1.05 |
| building_epoch_institute_2 | 2 | 0.1 | 2.1 |
| building_epoch_archive_1 | 1.5 | 0.1 | 1.6 |
| building_epoch_archive_2 | 3 | 0.2 | 3.2 |
| building_epoch_phase_1 | 1 | 0.05 | 1.05 |
| building_epoch_phase_2 | 2 | 0.1 | 2.1 |
| building_epoch_factory_1 | 0 | 0 | 0 |
| building_epoch_factory_2 | 0 | 0 | 0 |
| building_epoch_academy_1 | 1.5 | 0.1 | 1.6 |
| building_epoch_academy_2 | 3 | 0.2 | 3.2 |

Factories are the bootstrap exception: no core construction/operating input. Full Factory I/II: 36/72 gross cores, with 54/108 minerals, 9/18 alloys and 28/56 energy total monthly input. Unstaffed output is zero; half-staffed output is 18/36. Their output is now unconditional native base production. Paid input deficits use the standard mineral/energy/alloy deficit situations and bankruptcy mechanics; immediate scripted production suspension is deliberately removed. This does not prove a hard stop at zero input stockpile.

Seven-family set I consumes 11.18 cores/month including staffed jobs; the top-tier set consumes 26.64. Reference battleship components consume 0.634 cores/month; starbase load 0.26925; philosophy edict 3.

| Empire | Colonies | Factories | Ships / building sets / bases | Gross cores | Total core use | Net | Net at half factory staffing |
|---|---:|---|---|---:|---:|---:|---:|
| small | 5 | 1 × I | 20 / 1 tier I / 3 | 36 | 27.66775 | 8.33225 | -9.66775 |
| medium | 15 | 2 × II | 100 / 2 top-tier / 8 | 144 | 121.834 | 22.166 | -49.834 |
| large | 30 | 4 × II | 200 / 4 top-tier / 20 | 288 | 241.745 | 46.255 | -97.745 |

One Factory II alone has a -169.745 core balance against the large scenario. A funded late empire has room for construction reserves, but removing two of four staffed factories causes a real shortfall. Early entry without ships/edict: one Factory I minus one staffed Lab I = 33.82 cores/month, so initial growth is not blocked. Factory inputs are additional industrial commitments: small 54 minerals /9 alloys /28 energy; medium 216 /36 /112; large 432 /72 /224.

Wilderness uses no jobs/building sets. Its existing network is priced at twice staffed industrial inputs and scales with colony thresholds, capped at six nodes. Both integration (3 cores) and one philosophy edict (3 cores) are included below, as are the same fleets/starbases. Early uses one production tier; medium/large use both researched tiers.

| Wilderness | Nodes | Gross | Core use | Net | Input minerals / alloys / energy |
|---|---:|---:|---:|---:|---|
| small | 2 | 72 | 19.48775 | 52.51225 | 216 / 36 / 112 |
| medium | 4 | 288 | 71.554 | 216.446 | 864 / 144 / 448 |
| large | 6 | 432 | 138.185 | 293.815 | 1296 / 216 / 672 |

## Megastructure commitments

Actual C resource tables, assuming the real owner passes the philosophy/eligibility/cap/input gates; mutually exclusive UAP output branches never generate cores. Running upgrade stages replace earlier stages.

| Group | Gross cores | Core upkeep | Net cores | Energy upkeep | Minerals upkeep |
|---|---:|---:|---:|---:|---:|
| entry | 24 | 12 | 12 | 200 | 400 |
| ultimate | 72 | 46 | 26 | 700 | 1200 |

Large B economy plus ultimate infrastructure: 360 gross cores − 287.74500 upkeep = 72.25500 net. At half factory staffing, even with all three operating megastructures, net is -71.74500. Turning off/capturing an installation changes both its output eligibility and industrial support; construction still consumes stockpiled cores separately.
