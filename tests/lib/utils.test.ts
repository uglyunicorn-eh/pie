import { describe, expect, test } from "bun:test";
import { decodeBuffer, deserialize, encodeBuffer, serialize } from "../../src/lib/utils";

describe("utils", () => {
  test("encode/decode roundtrip", () => {
    expect(encodeBuffer(new Uint8Array())).toBe("");
    expect(encodeBuffer(new TextEncoder().encode("hello"))).toBe("aGVsbG8");
    expect(decodeBuffer("")).toEqual(new Uint8Array());
    expect(new TextDecoder().decode(decodeBuffer("aGVsbG8"))).toBe("hello");
    expect(decodeBuffer(encodeBuffer(new Uint8Array([1, 2, 3])))).toEqual(
      new Uint8Array([1, 2, 3])
    );
  });
  test("serialize/deserialize roundtrip", () => {
    expect(new TextDecoder().decode(serialize({ message: "hello" }))).toBe('{"message":"hello"}');
    expect(deserialize(new TextEncoder().encode('{"message":"hello"}'))).toEqual({
      message: "hello",
    });
    expect(deserialize(serialize({ message: "hi", n: 42 }))).toEqual({ message: "hi", n: 42 });
  });
});
