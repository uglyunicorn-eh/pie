import type { EnvelopeContext as EnvelopeContextType } from "..";
import type { Envelope } from "./hpke";

export { createCipherSuite, envelopeContext, type Envelope } from "./hpke";

export type EnvelopeContext = EnvelopeContextType<Envelope>;
