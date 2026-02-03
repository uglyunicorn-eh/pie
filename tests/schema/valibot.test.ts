import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";

import {
  createCipherSuite,
  envelopeContext,
  openEnvelope,
  sealEnvelope,
} from "../../src/crypto/hpke";
import { envelope } from "../../src/schema/valibot";
import { decodeBuffer } from "../../src/lib/utils";

const KEY_MATERIAL = "ylQcrQJlfa-BxdTtWZDLpGKZ3X0XwxCuVBeiCG2q06U";
const payloadSchema = v.object({ message: v.string() });

const suite = createCipherSuite();
const keyPair = await suite.DeriveKeyPair(decodeBuffer(KEY_MATERIAL), true);
const keyPair2 = await suite.GenerateKeyPair(true);

describe("envelope (valibot)", () => {
  test("no ctx returns schema as-is", () => {
    const result = envelope(payloadSchema);
    expect(result).toBe(payloadSchema);
    expect(toJsonSchema(result)).toMatchObject({
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"],
    });
  });

  test("empty ctx (repeat) returns envelope schema", () => {
    const result = envelope(payloadSchema, {});
    expect(toJsonSchema(result)).toMatchObject({
      type: "object",
      properties: { ct: { type: "string" }, enc: { type: "string" } },
      required: ["ct", "enc"],
    });
  });

  test("cipher context: schema seals payload to envelope", async () => {
    const cipher = envelopeContext({ out: keyPair });
    const sealedSchema = envelope(payloadSchema, cipher);
    const payload = { message: "secret" };
    const sealed = await v.parseAsync(sealedSchema, payload);
    expect(sealed).toHaveProperty("ct");
    expect(sealed).toHaveProperty("enc");
    expect(sealed.ct).toBeTruthy();
    expect(sealed.enc).toBeTruthy();
    const plain = { ct: String(sealed.ct), enc: String(sealed.enc) };
    const opened = await openEnvelope(payloadSchema, plain, keyPair.privateKey);
    expect(opened).toEqual(payload);
  });

  test("decipher context: schema opens envelope to payload", async () => {
    const decipher = envelopeContext({ in: keyPair });
    const openedSchema = envelope(payloadSchema, decipher);
    const sealed = await sealEnvelope(payloadSchema, { message: "hello" }, keyPair.publicKey);
    const opened = await v.parseAsync(openedSchema, sealed);
    expect(opened).toEqual({ message: "hello" });
  });

  test("retranslate context: envelope to envelope", async () => {
    const retranslate = envelopeContext({ in: keyPair, out: keyPair });
    const retranslateSchema = envelope(payloadSchema, retranslate);
    const sealed = await sealEnvelope(payloadSchema, { message: "relay" }, keyPair.publicKey);
    const result = await v.parseAsync(retranslateSchema, sealed);
    expect(result).toHaveProperty("ct");
    expect(result).toHaveProperty("enc");
    const plain = { ct: String(result.ct), enc: String(result.enc) };
    const opened = await openEnvelope(payloadSchema, plain, keyPair.privateKey);
    expect(opened).toEqual({ message: "relay" });
  });

  test("retranslate: result is encrypted with out key, not original key", async () => {
    const sealed = await sealEnvelope(payloadSchema, { message: "secret" }, keyPair.publicKey);
    const retranslate = envelopeContext({ in: keyPair, out: keyPair2 });
    const retranslateSchema = envelope(payloadSchema, retranslate);
    const result = await v.parseAsync(retranslateSchema, sealed);
    const plain = { ct: String(result.ct), enc: String(result.enc) };
    expect(await openEnvelope(payloadSchema, plain, keyPair2.privateKey)).toEqual({
      message: "secret",
    });
    await expect(openEnvelope(payloadSchema, plain, keyPair.privateKey)).rejects.toThrow();
  });

  test("envelope schema validates ct and enc", async () => {
    const repeatSchema = envelope(payloadSchema, {});
    await expect(v.parseAsync(repeatSchema, { ct: "x", enc: "y" })).resolves.toEqual({
      ct: "x",
      enc: "y",
    });
    await expect(v.parseAsync(repeatSchema, { ct: 1, enc: "y" })).rejects.toThrow();
    await expect(v.parseAsync(repeatSchema, {})).rejects.toThrow();
  });
});
