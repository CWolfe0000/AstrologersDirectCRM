/**
 * Sunrise and sunset for a date and place, by the standard NOAA solar equations
 * (accurate to about a minute, which is ample for planetary hours).
 */
const RAD = Math.PI / 180;

/** Times in ms since the epoch for the given calendar date at that longitude; null where the Sun does not rise or set that day. */
export function sunriseSunset(year: number, month: number, day: number, lat: number, lon: number): { rise: number; set: number } | null {
  const midnight = Date.UTC(year, month - 1, day);
  // Fractional year at local solar noon.
  const start = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((midnight - start) / 86_400_000);
  const g = ((2 * Math.PI) / 365) * (dayOfYear + (12 - lon / 15 - 12) / 24);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  // 90.833°: the Sun's upper edge on the horizon, with refraction.
  const cosH = Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl)) - Math.tan(lat * RAD) * Math.tan(decl);
  if (cosH > 1 || cosH < -1) return null;
  const H = Math.acos(cosH) / RAD;
  const minutes = (ha: number) => 720 - 4 * (lon + ha) - eqTime;
  return { rise: midnight + minutes(H) * 60_000, set: midnight + minutes(-H) * 60_000 };
}
