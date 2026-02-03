import * as v from "valibot";

import { type EnvelopeContext as EnvelopeContextType } from "..";

import type { CipherContext, DecipherContext, RetranslateContext, RepeatContext } from "..";

type AnySchema<I> =
  | v.BaseSchema<I, unknown, v.BaseIssue<I>>
  | v.BaseSchemaAsync<I, unknown, v.BaseIssue<I>>;

const envelopeSchema = v.object({
  ct: v.string(),
  enc: v.string(),
});

export type Envelope = v.InferOutput<typeof envelopeSchema>;

export type EnvelopeContext = EnvelopeContextType<Envelope>;

export function envelope<T>(
  schema: AnySchema<T>,
  ctx: CipherContext<Envelope>
): v.BaseSchema<T, Envelope, v.BaseIssue<T>>;

export function envelope<T>(
  schema: AnySchema<T>,
  ctx: DecipherContext<Envelope>
): v.BaseSchema<Envelope, T, v.BaseIssue<Envelope>>;

export function envelope<T>(
  schema: AnySchema<T>,
  ctx: RetranslateContext<Envelope>
): v.BaseSchema<Envelope, Envelope, v.BaseIssue<Envelope>>;

export function envelope<T>(
  schema: AnySchema<T>,
  ctx: RepeatContext
): v.BaseSchema<Envelope, Envelope, v.BaseIssue<Envelope>>;

export function envelope<T>(schema: AnySchema<T>): v.BaseSchema<T, T, v.BaseIssue<T>>;

export function envelope<T>(
  schema: AnySchema<T>,
  ctx?:
    | CipherContext<Envelope>
    | DecipherContext<Envelope>
    | RetranslateContext<Envelope>
    | RepeatContext
) {
  if (ctx === undefined) {
    return schema;
  }

  if ("open" in ctx && "seal" in ctx) {
    return v.pipeAsync(
      envelopeSchema,
      v.transformAsync((envelope) => ctx.open(schema, envelope)),
      v.transformAsync((payload) => ctx.seal(schema, payload))
    );
  }

  if ("open" in ctx) {
    return v.pipeAsync(
      envelopeSchema,
      v.transformAsync((envelope) => ctx.open(schema, envelope))
    );
  }

  if ("seal" in ctx) {
    return v.pipeAsync(
      schema,
      v.transformAsync((message) => ctx.seal(schema, message))
    );
  }

  return envelopeSchema;
}
