import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode, hotp, newRecoveryCodes, verifyTotp, totp } from "@/lib/server/totp";

describe("one-time passwords", () => {
  // RFC 4226 Appendix D test vectors (secret "12345678901234567890").
  const secret = base32Encode(Buffer.from("12345678901234567890"));
  it.each([
    [0, "755224"], [1, "287082"], [2, "359152"], [3, "969429"], [4, "338314"],
    [5, "254676"], [6, "287922"], [7, "162583"], [8, "399871"], [9, "520489"],
  ])("HOTP counter %i → %s", (counter, expected) => {
    expect(hotp(secret, counter)).toBe(expected);
  });

  it("base32 round-trips", () => {
    const b = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255, 7]);
    expect(base32Decode(base32Encode(b))).toEqual(b);
  });

  it("accepts the current code and one step of drift, nothing older", () => {
    const now = 1_800_000_000_000;
    expect(verifyTotp(secret, totp(secret, now), now)).toBe(true);
    expect(verifyTotp(secret, totp(secret, now - 30_000), now)).toBe(true);
    expect(verifyTotp(secret, totp(secret, now - 90_000), now)).toBe(false);
    expect(verifyTotp(secret, "abcdef", now)).toBe(false);
  });

  it("recovery codes are unique and well-formed", () => {
    const codes = newRecoveryCodes();
    expect(new Set(codes).size).toBe(10);
    codes.forEach((c) => expect(c).toMatch(/^[a-z2-7]{4}-[a-z2-7]{4}$/));
  });
});
