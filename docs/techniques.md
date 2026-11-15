# Chart techniques — methods and defaults

The code is in `lib/astro/techniques/` and is covered by unit tests (`tests/unit/techniques.test.ts`, `tests/unit/spherical.test.ts`).

None of it is in the app yet. It will be connected to Sky's Swiss Ephemeris once Sky's fixes land. Until then, the screens still use the demonstration engine.

Every method choice is an option. The defaults marked **provisional** are placeholders until you confirm them.

## What each technique produces

| Technique | Function | Options |
|---|---|---|
| Synastry | `synastry(A, B, { rules, includeAngles })` | Aspect set and orbs. Whether to include ASC/MC as points. |
| Midpoint composite | `midpointComposite(A, B, eph, { houseMethod, houseSystem, latitudes })` | `houseMethod`: **"derived-mc"** (provisional) or "midpoint-cusps" |
| Secondary progressions | `secondaryProgressions(natal, target, eph, { angles })` | `angles`: **"solar-arc-longitude"** (provisional), "solar-arc-ra", "naibod-longitude", "naibod-ra" |
| Solar arc directions | `solarArcDirections(natal, target, eph, { arc, angles })` | `arc`: **"true"** (provisional), "naibod", "one-degree". `angles`: **"plus-arc"** (provisional) or any progression angle method. |
| Solar return | `solarReturn(natal, year, eph, { precessionCorrected, place })` | `precessionCorrected`: **false** (provisional). `place`: **birthplace** (provisional), or any location for a relocated return. |

### Synastry

Synastry is written from scratch, as agreed. It shows:
- **Inter-aspects:** every point of person A against every point of person B. Each pair gets its tightest aspect within orb, with the exact orb and whether it is applying or separating.
- **House overlays:** each person's points placed in the other's houses, both ways.

House overlays use **strict cusps**: a planet exactly on a cusp is in that house, and there is no 3° "cusp gradient". There are **no scores, weights, rankings or interpretive labels**. A test checks that none appear in the output.

Applying and separating between two natal charts comes from each chart's natal speeds. It is a convention rather than a real motion, and it is shown because practitioners expect it.

### Midpoint composite

- Each planet is the midpoint of the two positions on the **shorter arc**, so 350° and 25° give 7.5°.
- A point present in only one chart is left out.
- **Houses, "derived-mc":** the composite MC is the midpoint of the two MCs, and houses are cast from that MC's right ascension at a reference latitude. By default that latitude is the midpoint of the two birth latitudes; a location can be given instead.
- **Houses, "midpoint-cusps":** each cusp is the midpoint of the two charts' cusps.
- Not yet handled: the "wrong-side" Mercury and Venus that some software corrects to stay near the composite Sun. This is a known judgement call. Say if you want a rule for it.

### Secondary progressions

- One day after birth for each year of life, using the tropical year (365.24219 days).
- **Progressed angles:**
  - Solar arc in longitude: the MC moves by the progressed Sun's arc.
  - Solar arc in right ascension: the RAMC moves by the Sun's arc measured in RA.
  - Naibod in longitude or RA: 0°59′08″ per year.

  The Ascendant and cusps are then cast from the directed MC/RAMC at the birth latitude.
- Mean-quotidian progressed angles are not offered yet.

### Solar arc directions

- Every natal point moves by the same arc:
  - true solar arc: progressed Sun − natal Sun
  - Naibod: 0°59′08″ per year
  - one degree per year
- By default the arc is also added to the ASC, MC and cusps ("plus-arc"). Alternatively the angles are directed like progressed angles and the houses re-cast.

### Solar return

- Finds the moment the Sun returns to its natal longitude in the chosen year, accurate to well under a second of time.
- **Precession-corrected** returns move the target forward by general precession since birth (50.29″ per year). The production version can use Swiss Ephemeris sidereal mode instead.
- Cast for the birthplace by default, or for any location (relocated return).

## Decisions still needed from you

1. **Progressed angles:** which of the four methods should be the default? Should mean-quotidian be added?
2. **Solar arc:** is the true solar arc the default? Should the arc be added straight to the angles, or should the angles be directed and the houses re-cast?
3. **Solar return:** precession-corrected or not by default? Birthplace by default?
4. **Composite houses:** derived from the composite MC, or midpoints of the cusps? Which reference place for derived houses?
5. **Default aspects and orbs** for AstrologersDirect. The provisional set is Sky's: majors only, with 8° orbs (5° for the sextile).

## Connecting to Sky (Swiss Ephemeris)

A small adapter implements `Ephemeris` (`lib/astro/techniques/types.ts`) using functions Sky's `swiss.js` already wraps:

| `Ephemeris` method | Swiss Ephemeris call |
|---|---|
| `bodies(utc)` | `swe_calc_ut` per body (Sky: `swiss.calculate`), with `SEFLG_SPEED` for speeds |
| `obliquity(utc)` | `swe_calc_ut(jd, SE_ECL_NUT)`, true obliquity (Sky already reads this in `houses()`) |
| `ramc(utc, lon)` | `swe_houses_ex2(…).points[2]` (ARMC) |
| `houses(utc, lat, lon, system)` | `swe_houses_ex2` (Sky: `swiss.houses`) |
| `housesFromRamc(ramc, lat, eps, system)` | `swe_houses_armc`, which the `sweph` package exposes as `houses_armc` |

Times go in as UTC. Sky's `time-scales.js` handles the UTC → UT1 conversion.

## Verifying against reference charts

The unit tests check the arithmetic against a stand-in ephemeris with simple linear motions, so expected values can be worked out by hand. They prove the methods are applied correctly. They do **not** prove the results match professional software.

Before any of this is labelled "verified" in the app:

1. Fill in `tests/fixtures/reference-charts.template.json` with charts calculated in software you trust (Solar Fire, Astro Gold, Kepler, astro.com, etc.). Include the method settings used for each.
2. Once the Sky adapter exists, `tests/reference-charts.test.ts` compares our results against those values, within one arcminute for planets and two for angles.
