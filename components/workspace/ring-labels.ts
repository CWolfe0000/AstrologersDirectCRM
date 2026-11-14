import type { ChartRecord, Person } from "@/lib/data/types";

export function ringLabels(chart: ChartRecord, people: Person[]) {
  const n = (id?: string) => people.find((p) => p.id === id)?.firstName ?? "—";
  switch (chart.type) {
    case "synastry":
      return { inner: n(chart.personIds[0]), outer: n(chart.personIds[1]) };
    case "transits":
      return { inner: "Natal", outer: "Transiting" };
    case "progressions":
      return { inner: "Natal", outer: "Progressed" };
    case "solar-arc":
      return { inner: "Natal", outer: "Directed" };
    case "composite":
      return { inner: "Composite", outer: "" };
    case "solar-return":
      return { inner: "Return", outer: "" };
    default:
      return { inner: "Natal", outer: "" };
  }
}
