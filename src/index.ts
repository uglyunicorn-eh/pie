import type { StandardSchemaV1 } from "@standard-schema/spec";

export interface CipherContext<E> {
  seal: SealEnvelope<E>;
}

export interface DecipherContext<E> {
  open: OpenEnvelope<E>;
}

export interface RetranslateContext<E> {
  open: OpenEnvelope<E>;
  seal: SealEnvelope<E>;
}

export interface RepeatContext {}

export type EnvelopeContext<E> =
  | CipherContext<E>
  | DecipherContext<E>
  | RetranslateContext<E>
  | RepeatContext;

/**
 * Envelope schema field.
 */
export interface Envelope<T, E> {
  /**
   * Seals data into an envelope.
   * @param schema - The schema of the data.
   * @param ctx - The options for the envelope.
   * @returns The sealed envelope.
   */
  (schema: StandardSchemaV1<T>, ctx: CipherContext<E>): StandardSchemaV1<T, E>;

  /**
   * Unseals data from an envelope.
   * @param schema - The schema of the data.
   * @param ctx - The options for the envelope.
   * @returns The unsealed data.
   */
  (schema: StandardSchemaV1<T>, ctx: DecipherContext<E>): StandardSchemaV1<E, T>;

  /**
   * Retranslates data between two envelopes. Decrypts the data with the decipher
   * and re-encrypts the data with the cipher.
   * @param schema - The schema of the data.
   * @param ctx - The options for the envelope.
   * @returns The retranslated data.
   */
  (schema: StandardSchemaV1<T>, ctx: RetranslateContext<E>): StandardSchemaV1<E>;

  /**
   * Repeats the envelope without modifying the data.
   *
   * @param schema - The schema of the data.
   * @param ctx - The options for the envelope.
   * @returns The repeated envelope.
   */
  (schema: StandardSchemaV1<T>, ctx: RepeatContext): StandardSchemaV1<E>;

  /**
   * Returns the schema without modifying the data.
   * @param schema - The schema of the data.
   * @returns The schema without modifying the data.
   */
  (schema: StandardSchemaV1<T>, ctx?: undefined): StandardSchemaV1<T>;
}

/**
 * Seals data into an envelope.
 */
export interface SealEnvelope<E> {
  <T>(schema: StandardSchemaV1<T>, data: T): Promise<E>;
}

/**
 * Opens an envelope.
 */
export interface OpenEnvelope<E> {
  <T>(schema: StandardSchemaV1<T>, envelope: E): Promise<T>;
}
