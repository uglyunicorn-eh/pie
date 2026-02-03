import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
  type Key,
  type KeyPair,
  CipherSuite,
  KEM_DHKEM_P256_HKDF_SHA256,
  KDF_HKDF_SHA256,
  AEAD_AES_128_GCM,
} from "hpke";

import { decodeBuffer, deserialize, encodeBuffer, serialize } from "../lib/utils";
import type { CipherContext, DecipherContext, RetranslateContext } from "..";

export class HpkeEnvelopeError extends Error {}

export interface Envelope {
  ct: string;
  enc: string;
}

export function createCipherSuite(): CipherSuite {
  return new CipherSuite(KEM_DHKEM_P256_HKDF_SHA256, KDF_HKDF_SHA256, AEAD_AES_128_GCM);
}

/**
 * Encrypts data using HPKE.
 *
 * The function validates the data against the schema
 * and then encrypts the data using the public key.
 *
 * @param data - The data to encrypt.
 * @param publicKey - The public key to use for encryption.
 * @returns The encrypted envelope.
 */
export async function sealEnvelope<T>(
  schema: StandardSchemaV1<T>,
  data: T,
  publicKey: Key
): Promise<Envelope> {
  const suite = createCipherSuite();

  const validated = await schema["~standard"].validate(data);
  if (validated.issues) {
    throw new HpkeEnvelopeError("Unable to seal envelope: invalid payload", {
      cause: validated.issues,
    });
  }

  const { ciphertext, encapsulatedSecret } = await suite.Seal(
    publicKey,
    serialize(validated.value)
  );

  return { ct: encodeBuffer(ciphertext), enc: encodeBuffer(encapsulatedSecret) };
}

/**
 * Decrypts data using HPKE.
 *
 * The function decrypts the data using the private key and then validates the
 * data against the schema.
 *
 * @param envelope - The envelope to decrypt.
 * @param privateKey - The private key to use for decryption.
 * @returns The decrypted data.
 */
export async function openEnvelope<T>(
  schema: StandardSchemaV1<T>,
  envelope: Envelope,
  privateKey: Key
): Promise<T> {
  const suite = createCipherSuite();

  const plaintext = await suite.Open(
    privateKey,
    decodeBuffer(envelope.enc),
    decodeBuffer(envelope.ct)
  );

  const payload = deserialize(plaintext);

  const validated = await schema["~standard"].validate(payload);
  if (validated.issues) {
    throw new HpkeEnvelopeError("Unable to open envelope: invalid payload", {
      cause: validated.issues,
    });
  }

  return validated.value;
}

export function envelopeContext(opts: { out: Pick<KeyPair, "publicKey"> }): CipherContext<Envelope>;

export function envelopeContext(opts: {
  in: Pick<KeyPair, "privateKey">;
}): DecipherContext<Envelope>;

export function envelopeContext(opts: {
  in: Pick<KeyPair, "privateKey">;
  out: Pick<KeyPair, "publicKey">;
}): RetranslateContext<Envelope>;

export function envelopeContext(): undefined;

export function envelopeContext(opts?: any) {
  if (opts?.in && opts?.out) {
    return {
      open: (schema, envelope) => openEnvelope(schema, envelope, opts.in.privateKey),
      seal: (schema, data) => sealEnvelope(schema, data, opts.out.publicKey),
    } as RetranslateContext<Envelope>;
  }

  if (opts?.in) {
    return {
      open: (schema, envelope) => openEnvelope(schema, envelope, opts.in.privateKey),
    } as DecipherContext<Envelope>;
  }

  if (opts?.out) {
    return {
      seal: (schema, data) => sealEnvelope(schema, data, opts.out.publicKey),
    } as CipherContext<Envelope>;
  }

  return undefined;
}
