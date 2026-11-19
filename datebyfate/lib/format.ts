const DATE = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "2027-03-12" → "Mar 12, 2027" */
export const formatDate = (iso: string) => DATE.format(new Date(iso + "T00:00:00Z"));

export const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

/** A share of people, in words: 0.21 → "about 1 in 5 people". */
export const oneIn = (rate: number) => (rate >= 0.4 ? `about ${Math.round(rate * 10) * 10}% of people` : `about 1 in ${Math.max(2, Math.round(1 / rate))} people`);
