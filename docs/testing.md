# Test plan

## Compatibility matrix

| Configuration | Required |
|---|---|
| Stellaris 4.5.3, EPOCH Core only | Yes |
| Stellaris 4.5.3, EPOCH + Gigastructures | Yes |
| Organic empire | Yes |
| Hive Mind | Yes |
| Machine Intelligence | Yes |
| Player and AI empires | Yes |
| English and German | Yes |
| Multiplayer host/client | Before release |

## Validation checklist

- [ ] Mod loads without parse errors.
- [ ] Vanilla files and content are not overwritten unnecessarily.
- [ ] Discovery timing is staggered; empires do not all trigger simultaneously.
- [ ] No new starting civic, trait, origin or start bonus is granted.
- [ ] All three empire classes can enter the progression.
- [ ] AI can discover, investigate and resolve content.
- [ ] Event chains cannot become permanently stuck.
- [ ] Situation progress and project completion behave as intended.
- [ ] Localisation keys exist in both languages.
- [ ] Core works with Gigastructures absent.
- [ ] Compatibility bridge works with the supported Gigastructures version.
- [ ] No avoidable high-frequency global polling.
- [ ] Multiplayer testing shows no reproducible desyncs.

Actual in-game testing must be performed in Stellaris. Static inspection alone is not
proof of runtime correctness.
