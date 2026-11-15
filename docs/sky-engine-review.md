# Sky engine review for AstrologersDirect

Reviewed: `CWolfe0000/Sky` at commit `1fd06b2` (2026-11-10), files under `engine/` and `service/engine/`.
Reviewed on 2026-11-15. This review is read-only: nothing in Sky was changed.

## Summary

Sky's calculation core can be reused for AstrologersDirect.

- **Natal calculations** are a solid base for the chart workspace.
- **Timing calculations** can drive consultation prep and client timelines with little change.

Sky does not yet cover everything the workspace needs:

- secondary progressions
- solar arcs
- solar returns
- midpoint composites
- sidereal zodiacs
- three of the house systems the prototype offers
- configurable aspects and orbs
- applying/separating status on natal aspects

Each of these is a contained addition on top of Sky's Swiss Ephemeris wrapper. None requires redesigning the engine.

Sky's synastry code should **not** be reused as it stands; see [Synastry and composite](#synastry-and-composite).

## What was verified

The checks followed the procedure in Sky's own documentation.

| Check | Result |
|---|---|
| Ephemeris download (`validation/download-official-ephemeris.sh`) | 3 files fetched from the pinned Astrodienst commit. Size, git blob hash and SHA-256 all verified. |
| `npm run test:swiss` | **5 / 5 pass** |
| `npm run test:engine` | **90 / 101 pass**, 11 failures (classified below) |
| Natal profile, house systems, calculation foundation, transit interpretation tests | **All pass** |
| Spot check: demo client "Amelia Hart" (1988-03-14 07:42, Portland, Placidus) | Sun 24°17′ Pisces, ASC 28°48′ Aries, MC 14°05′ Capricorn. Plausible, with the full rulers, dispositors and aspects structure present. |

The repo has no `package-lock.json`, so `npm ci` refuses to run. Dependencies were installed with `npm install --no-package-lock` to avoid writing a lockfile into Sky. Commit a lockfile so builds are reproducible.

### The 11 engine-test failures

None of the failures are in the calculation tests.

| Tests | Cause | Relevant to AstrologersDirect? |
|---|---|---|
| `test-birth-time.js` ×2, `test-engine-http.js` ×1 | The environment needs `GEO_PROVIDER=geoapify` (geocoder config). | No: environment setup |
| `test-birth-time-ui.js` ×1 | Checks controls on the LLZ customise page. | No: LLZ web page |
| `test-engine-preview.js` | The test file has a **syntax error**: an over-escaped regex on line 6, so the file never runs. | No, but worth fixing in Sky |
| `test-engine.js` "Saturn square MC at 2°" | `preview-in-orb` behaviour. The test stubs `we.buildChart`, which the Swiss path no longer uses. | Indirectly; see mirror drift below |
| `test-presentation*.js` ×5 | LLZ presentation and review layer (Step 6, D-046 digests). | No: consumer presentation |

### Mirror drift between `engine/` and `service/engine/`

Sky's own `scripts/check-mirror-parity.js` currently **fails**:

- `engine/preview-in-orb.js` has drifted. The `service/` copy has about 30 extra lines that extend orb windows past the preview boundary.
- `scripts/d062-worker.js` has also drifted.

Render deploys from `service/`, so the root `engine/` copy is behind. **AstrologersDirect should depend on one copy of the engine**; see the recommendation below.

## What Sky provides

### Natal: `engine/natal-profile.js` → `buildNatalProfile(birth)`

- **Swiss Ephemeris setup.** File-backed mode only. It refuses to fall back silently to the Moshier mode, and it records provider, version, flags and time scale per result.
- **Time handling.** Uses UT1, a tabulated leap-second history, and IANA time zones. Birth times that fall in a daylight-saving gap or overlap are handled explicitly.
- **Points.** Sun–Pluto, Chiron, true node, south node, ASC and MC. `we.js` also computes Vertex, Ceres, Pallas, Juno and Vesta.
- **Houses.** Placidus, Koch, Whole Sign and Equal, with a polar fallback above 66.5° that is reported.
- **Rulers.** Traditional sign rulers, house rulers, houses ruled, chart ruler, full dispositor chains (terminal or cycle), and intercepted signs.
- **Unknown birth times.** Signs are reported only for the bodies a local-noon reference can support. No houses, angles or natal aspects are asserted. This matches the prototype's "time accuracy" field.
- **Aspects.** Five major aspects with fixed orbs: 8° for conjunction, square, trine and opposition, 5° for sextile.

### Timing

| Module | Provides |
|---|---|
| `astro_transit_ics.js` `transitEvents` | Exact transit hits to natal points, including every pass of a retrograde sequence. Transiting planets and natal targets are configurable. Results carry house context and evidence. |
| `transit-interpretation.js` | Orb-entry and orb-exit intervals, applying or separating phase, and a priority tier per transit. |
| `sky.js` | Sign ingresses and stations (station times use Swiss speed roots). |
| `astro_transit_ics.js` `lunationEvents` | New and full moons, eclipses with subtype, and the natal house each falls in. |

Calculation results are validated against pyswisseph (`docs/sky-swiss-validation.md`):

- 852 dates
- 440 ingresses
- 163 stations
- 238 transit aspects
- 41 eclipses

All results fall within <0.001 s or 0.01°.

### Interpretation

`interpretation-rules.json` (59 KB) provides structured rules. A fact packet goes to the model, and a validator plus prose guard check the output:

- `claim-packet.js` builds the fact packet.
- `claim-model-renderer.js` sends it to the model (currently OpenAI `gpt-4.1`).
- `claim-validator.js` and `prose-guard.js` check the output.
- `scripts/d062-worker.js` generates readings and caches them.

**For AstrologersDirect,** the *pattern* of keeping calculated facts separate from generated text is exactly what the brief asks of the AI assistant. The *content* is written for consumers ("your…"), so it would need rewriting for practitioners.

## Mapping to the prototype

The prototype's UI talks only to the `AstrologyEngine` interface in `lib/astro/types.ts`.

| Prototype need | Sky today | Work needed |
|---|---|---|
| Natal wheel, placements, houses, rulers, condition | ✅ `buildNatalProfile` | Adapter only. Add essential dignity (already in `we.js`) to the output. |
| Retrograde flags | Speed is available from `swiss.calculate` | Expose speed |
| Aspects: configurable set and orbs, minor aspects, applying/separating | Fixed set of 5 majors, no phase | Small: parametrise `natalAspects`. Phase comes from speeds. |
| House systems: Porphyry, Regiomontanus, Campanus | Not mapped | Trivial: add Swiss codes `O`, `R`, `C` to `swiss.js`, plus tests |
| Sidereal zodiac (Lahiri, Fagan/Bradley) | Not supported | Small: `swe_set_sid_mode` + `SEFLG_SIDEREAL`. Needs validation fixtures. |
| Transit bi-wheel (positions at a moment) | ✅ `we.eclLon` / `swiss.calculate` | Adapter only |
| Upcoming transits for consultation prep | ✅ `transitEvents`, `buildTransitInterpretation` | Adapter, plus practitioner-facing labels |
| Lunations, eclipses, ingresses, stations | ✅ | Adapter |
| Secondary progressions | ❌ | Small, but needs a **method decision** for progressed angles (see below) |
| Solar arc directions | ❌ | Small, with the same method decision |
| Solar return | ❌ | Small: find the Sun's return with Sky's `event-math` bisection, then cast the chart. Needs a precession-correction decision. |
| Synastry | ⚠️ Present in `we.js`, but opinionated | See [Synastry and composite](#synastry-and-composite) |
| Midpoint composite | ❌ | Small, with a house-method decision |
| Birth years before 1800 | ❌ Hard limit of 1800–2050 in `birth-time.js` and `chart-context.js` | Decide whether historical charts matter. `sepl_18` covers 1800–2399, so years after 2050 only need the limit lifted and tested. |

## Synastry and composite

`we.js` contains a full synastry engine, but it scores the relationship rather than reporting it:

- an overall compatibility percentage built from "harmony" and "tension" weights
- an element-interchange "ease" score
- interpretive labels ("Core Vitalization", "Unconscious Projection")
- a weighted "native capacity" profile in the Arroyo style
- house overlays computed with a **3° cusp gradient** (`houseOf`). This places a planet 3° before a cusp in the next house, which is not the standard placement and differs from the strict `houseOfStrict` the natal path uses.

That suits a consumer product. A professional workspace should show the astrologer the inter-aspects and overlays and leave judgement to them. **Recommendation:**

- Reuse the Swiss-backed `buildChart` for both people.
- Write a small, neutral synastry module: inter-aspects with configurable orbs, house overlays using strict cusps, and no scores.
- Build the midpoint composite on the same module.
- Validate both against reference charts that you or a trusted astrologer supply, before anything is labelled verified.

## Recommended integration

1. **Extract one engine package.** Move the calculation core into a single package that both Sky's `service/` and AstrologersDirect depend on, for example a `packages/sky-engine` workspace or a private npm package. Scope it to `swiss.js`, `we.js` (calculation parts), `time-scales`, `birth-time`, `chart-context`, `house-resolution`, `natal-profile`, `event-math`, the retrograde modules, `sky.js` and the transit modules. This removes the `engine/` vs `service/engine/` drift for good.
2. **Run calculations on a server.** `sweph` is a native add-on that needs the ephemeris files on disk, and the licence check runs at import time. That suits a long-running Node service, for example a small "astro API" on Render next to Sky's existing services. It does not suit browser or serverless functions. The AstrologersDirect web app calls this API.
3. **Make the prototype's interface asynchronous.** `AstrologyEngine` is synchronous today because the demo engine runs in the browser. Change it to return promises, and add loading states to the chart hooks. This is a UI-side change worth making early.
4. **Fix a few things in Sky first:**
   - Commit a lockfile.
   - Fix the syntax error in `test-engine-preview.js`.
   - Resolve the two drifted mirror files.
   - Note that `swiss.js` throws at import when `SWEPH_EPHE_PATH` is unset; the package should expose an explicit `init()` instead.

## Decisions needed from you, as the astrologer

1. **Progressed angles:** solar arc in longitude, solar arc in right ascension, Naibod, or a mean-quotidian method?
2. **Solar returns:** tropical without precession correction (the common default), or precessed? Cast for the birthplace by default, with relocation as an option?
3. **Composite houses:** midpoints of the cusps, or houses derived from the composite MC at the couple's location or the birthplace?
4. **Default aspect set and orbs** for AstrologersDirect. Sky's current 8°/5° majors, or the prototype's wider set including the quincunx?
5. **Historical charts:** do you need births before 1800?
6. **Synastry:** confirm that the professional workspace should show **no compatibility scores**.

## Licence checklist (Swiss Ephemeris)

You said the Professional License was purchased on 2026-11-10. Before AstrologersDirect goes live:

- [ ] Read the executed agreement and confirm the **licensee entity**. Check that it covers whichever entity will operate AstrologersDirect, and whether that is a different entity from Live Laugh Zodiac.
- [ ] Confirm the agreement allows **more than one product or service**: Sky/LLZ and AstrologersDirect.
- [ ] Confirm it allows **server-side / SaaS** use. Clients never receive the library or the data files.
- [ ] Keep Sky's deployment gate as it is: `SKY_SWISS_LICENSE_COUNTERSIGNED=1` set only in production, once the above are confirmed.
- [ ] Check the attribution or notice wording the agreement requires. Sky's docs say only "Swiss Ephemeris Inside" is permitted if attribution is shown.

This is a list of things to check, not legal advice. The agreement's own wording is what counts.

## Suggested next steps

1. Answer the decisions above.
2. Set up the shared engine package and the astro API skeleton, with natal and transit endpoints only.
3. Write an `AstrologyEngine` adapter in AstrologersDirect that calls the API. Keep the demo engine as an offline fallback, clearly labelled.
4. Add progressions, solar arcs, solar returns, synastry and composite one at a time. Each needs reference-chart tests before the UI shows it as verified.
