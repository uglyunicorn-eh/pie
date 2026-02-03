import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";
import {
  createCipherSuite,
  envelopeContext,
  HpkeEnvelopeError,
  openEnvelope,
  sealEnvelope,
} from "../../src/crypto/hpke";
import { envelope } from "../../src/schema/valibot";
import { decodeBuffer } from "../../src/lib/utils";

const KEY_MATERIAL = "ylQcrQJlfa-BxdTtWZDLpGKZ3X0XwxCuVBeiCG2q06U";
const payloadSchema = v.object({ message: v.string() });
type Payload = v.InferOutput<typeof payloadSchema>;

const suite = createCipherSuite();
const keyPair = await suite.DeriveKeyPair(decodeBuffer(KEY_MATERIAL), true);

describe("hpke", () => {
  test("seal/open and validation branches", async () => {
    const sealed = await sealEnvelope(payloadSchema, { message: "hi" }, keyPair.publicKey);
    expect(await openEnvelope(payloadSchema, sealed, keyPair.privateKey)).toEqual({
      message: "hi",
    });
    await expect(
      sealEnvelope(payloadSchema, { message: 123 } as unknown as Payload, keyPair.publicKey)
    ).rejects.toThrow(HpkeEnvelopeError);
    const strictSchema = v.object({ message: v.pipe(v.string(), v.minLength(100)) });
    await expect(openEnvelope(strictSchema, sealed, keyPair.privateKey)).rejects.toThrow(
      HpkeEnvelopeError
    );
  });
  test("envelopeContext with no opts returns undefined", () => {
    expect(envelopeContext()).toBeUndefined();
  });
  test("envelopeContext and envelope() branches", () => {
    const decipher = envelopeContext({ in: keyPair });
    const cipher = envelopeContext({ out: keyPair });
    const retranslate = envelopeContext({ in: keyPair, out: keyPair });
    expect(envelope(payloadSchema, decipher)).toBeDefined();
    expect(envelope(payloadSchema, cipher)).toBeDefined();
    expect(envelope(payloadSchema, retranslate)).toBeDefined();
    expect(toJsonSchema(envelope(payloadSchema))).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "properties": {
          "message": {
            "type": "string",
          },
        },
        "required": [
          "message",
        ],
        "type": "object",
      }
    `);
    expect(toJsonSchema(envelope(payloadSchema, {}))).toMatchInlineSnapshot(`
      {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "properties": {
          "ct": {
            "type": "string",
          },
          "enc": {
            "type": "string",
          },
        },
        "required": [
          "ct",
          "enc",
        ],
        "type": "object",
      }
    `);
  });
});
