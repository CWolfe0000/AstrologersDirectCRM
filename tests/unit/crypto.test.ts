import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.APP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});

describe("field encryption", () => {
  it("round-trips values and never stores plaintext", async () => {
    const { seal, unseal } = await import("@/lib/server/crypto");
    const secret = { birth: { date: "1988-03-14", time: "07:42", place: "Portland" }, notes: "private" };
    const c = seal(secret);
    expect(c.startsWith("v1.")).toBe(true);
    expect(c).not.toContain("Portland");
    expect(unseal(c)).toEqual(secret);
  });

  it("uses a fresh IV each time", async () => {
    const { seal } = await import("@/lib/server/crypto");
    expect(seal("same")).not.toEqual(seal("same"));
  });

  it("detects tampering", async () => {
    const { seal, unseal } = await import("@/lib/server/crypto");
    const parts = seal({ a: 1 }).split(".");
    parts[3] = parts[3]!.slice(0, -2) + (parts[3]!.endsWith("A") ? "BB" : "AA");
    expect(() => unseal(parts.join("."))).toThrow();
  });

  it("hashes tokens so the stored value can't be used as a cookie", async () => {
    const { newToken, sha256 } = await import("@/lib/server/crypto");
    const t = newToken();
    expect(t.hash).toBe(sha256(t.raw));
    expect(t.hash).not.toBe(t.raw);
  });
});
