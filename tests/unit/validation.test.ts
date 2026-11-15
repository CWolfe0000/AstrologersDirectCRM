import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { COLLECTION_SCHEMAS } from "@/lib/server/validation";
import { associatedPeople, clientPeople, clients } from "@/lib/data/people";
import * as seed from "@/lib/data/records";
import type {
  Activity, AppNotification, ChartRecord, Client, ClientFile, Consultation, Observation, Person, PortalNotification, Reading, Recording, Task,
} from "@/lib/data/types";

/**
 * Compile-time drift check: every value the UI's TypeScript types allow must
 * be accepted by the server schema. If a field is added to lib/data/types.ts
 * without updating lib/server/validation.ts, `npm run typecheck` fails here.
 */
type Accepts<Schema extends z.ZodTypeAny, T> = T extends z.input<Schema>
  ? Exclude<keyof T, keyof z.input<Schema>> extends never
    ? true
    : { missingFromServerSchema: Exclude<keyof T, keyof z.input<Schema>> }
  : never;
const drift: [
  Accepts<typeof COLLECTION_SCHEMAS.people, Person>,
  Accepts<typeof COLLECTION_SCHEMAS.clients, Client>,
  Accepts<typeof COLLECTION_SCHEMAS.charts, ChartRecord>,
  Accepts<typeof COLLECTION_SCHEMAS.observations, Observation>,
  Accepts<typeof COLLECTION_SCHEMAS.consultations, Consultation>,
  Accepts<typeof COLLECTION_SCHEMAS.tasks, Task>,
  Accepts<typeof COLLECTION_SCHEMAS.readings, Reading>,
  Accepts<typeof COLLECTION_SCHEMAS.recordings, Recording>,
  Accepts<typeof COLLECTION_SCHEMAS.files, ClientFile>,
  Accepts<typeof COLLECTION_SCHEMAS.notifications, AppNotification>,
  Accepts<typeof COLLECTION_SCHEMAS.activity, Activity>,
  Accepts<typeof COLLECTION_SCHEMAS.portalNotifications, PortalNotification>,
] = [true, true, true, true, true, true, true, true, true, true, true, true];
void drift;

const SEED: [keyof typeof COLLECTION_SCHEMAS, unknown[]][] = [
  ["people", [...clientPeople, ...associatedPeople]],
  ["clients", clients],
  ["charts", seed.charts],
  ["observations", seed.observations],
  ["consultations", seed.consultations],
  ["tasks", seed.tasks],
  ["readings", seed.readings],
  ["recordings", seed.recordings],
  ["files", seed.files],
  ["notifications", seed.notifications],
  ["activity", seed.activity],
  ["portalNotifications", seed.portalNotifications],
];

describe("server validation", () => {
  it.each(SEED)("accepts every sample %s record", (collection, rows) => {
    for (const row of rows) {
      const r = COLLECTION_SCHEMAS[collection].safeParse(row);
      expect(r.success, `${collection} ${(row as { id: string }).id}: ${JSON.stringify(r.error?.flatten())}`).toBe(true);
    }
  });

  it("rejects unknown fields", () => {
    const r = COLLECTION_SCHEMAS.tasks.safeParse({ ...seed.tasks[0], ownerId: "someone-else" });
    expect(r.success).toBe(false);
  });

  it("rejects ids that could escape the URL path", () => {
    expect(COLLECTION_SCHEMAS.tasks.safeParse({ ...seed.tasks[0], id: "../x" }).success).toBe(false);
  });

  it("rejects script URLs on deliveries", () => {
    const base = seed.readings.find((r) => r.kind === "link")!;
    expect(COLLECTION_SCHEMAS.readings.safeParse({ ...base, url: "javascript:alert(1)" }).success).toBe(false);
    expect(COLLECTION_SCHEMAS.readings.safeParse({ ...base, url: "https://example.com/x" }).success).toBe(true);
  });
});
