// Fails the build if the Swiss Ephemeris module or its data files are unusable, instead of failing a visitor's first reading.
const path = require("node:path");
const sw = require("sweph");
sw.set_ephe_path(process.env.SWEPH_EPHE_PATH || path.join(process.cwd(), ".sweph-ephe"));
const jd = sw.utc_to_jd(1990, 6, 15, 13, 30, 0, sw.constants.SE_GREG_CAL).data[1];
const r = sw.calc_ut(jd, sw.constants.SE_SUN, sw.constants.SEFLG_SWIEPH | sw.constants.SEFLG_SPEED);
if (r.flag < 0 || !(r.flag & sw.constants.SEFLG_SWIEPH) || Math.abs(r.data[0] - 84.1) > 0.5) {
  console.error("Swiss Ephemeris check failed:", r);
  process.exit(1);
}
console.log(`Swiss Ephemeris check passed: Sun at ${r.data[0].toFixed(3)}° on 1990-06-15 13:30 UT.`);
