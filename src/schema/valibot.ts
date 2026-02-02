import * as v from "valibot";

import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { CipherContext, DecipherContext, RetranslateContext, RepeatContext } from "..";

const envelopeSchema = v.object({
  ct: v.string(),
  enc: v.string(),
});

export type Envelope = v.InferOutput<typeof envelopeSchema>;

export function envelope<T>(
  schema: StandardSchemaV1<T>,
  ctx: CipherContext<Envelope>
): v.BaseSchema<T, Envelope, v.BaseIssue<T>>;

export function envelope<T>(
  schema: StandardSchemaV1<T>,
  ctx: DecipherContext<Envelope>
): v.BaseSchema<Envelope, T, v.BaseIssue<Envelope>>;

export function envelope<T>(
  schema: StandardSchemaV1<T>,
  ctx: RetranslateContext<Envelope>
): v.BaseSchema<Envelope, Envelope, v.BaseIssue<Envelope>>;

export function envelope<T>(
  schema: StandardSchemaV1<T>,
  ctx: RepeatContext
): v.BaseSchema<Envelope, Envelope, v.BaseIssue<Envelope>>;

export function envelope<T>(schema: StandardSchemaV1<T>): v.BaseSchema<T, T, v.BaseIssue<T>>;

export function envelope<T>(schema: StandardSchemaV1<T>, ctx?: any) {
  if (ctx === undefined) {
    return schema;
  }
  if ("open" in ctx && "seal" in ctx) {
    return envelopeSchema;
  }
  if ("open" in ctx) {
    return schema;
  }
  if ("seal" in ctx) {
    return envelopeSchema;
  }
  return envelopeSchema;
}
