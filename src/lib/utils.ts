/**
 * Encodes a Uint8Array to a base64url string.
 *
 * @param data - The data to encode.
 * @returns The encoded data.
 */
export function encodeBuffer(data: Uint8Array): string {
  return data.toBase64({
    alphabet: "base64url",
    omitPadding: true,
  });
}

/**
 * Decodes a base64url string to Uint8Array.
 *
 * @param encoded - The encoded data.
 * @returns The decoded data.
 */
export function decodeBuffer(encoded: string): Uint8Array {
  return new Uint8Array(Buffer.from(encoded, "base64url"));
}

/**
 * Serializes data to a Uint8Array.
 *
 * @param data - The data to serialize.
 * @returns The serialized data.
 */
export function serialize(data: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(data));
}

/**
 * Deserializes data from a Uint8Array.
 *
 * @param data - The data to deserialize.
 * @returns The deserialized data.
 */
export function deserialize(data: Uint8Array): unknown {
  return JSON.parse(new TextDecoder().decode(data));
}
