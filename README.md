# π

Protected Information Envelope — Schema-validated envelopes using [HPKE](https://www.rfc-editor.org/rfc/rfc9180.html).

Validate payloads with your schema, seal with a public key, and open with the matching private key. Supports retranslation (decrypt with one key, re-encrypt with another) so the original key cannot open the new envelope.

## Install

```bash
bun add @uglyunicorn/pie valibot
# or: npm install @uglyunicorn/pie valibot
```

## Example (Valibot)

```ts
import * as v from "valibot";

import { envelope, type Envelope } from "@uglyunicorn/pie/valibot";
import { createCipherSuite, envelopeContext } from "@uglyunicorn/pie/crypto";
import type { EnvelopeContext } from "@uglyunicorn/pie";

const userProfileSchema = (ctx: EnvelopeContext<Envelope>) =>
  v.objectAsync({
    identity: envelope(
      v.object({
        name: v.string(),
        email: v.string(),
      }),
      ctx
    ),
    height: v.number(),
    weight: v.number(),
  });

const userProfile = {
  identity: {
    name: "John Doe",
    email: "john.doe@example.com",
  },
  height: 180,
  weight: 70,
};

const suite = createCipherSuite();
const keyPair = await suite.GenerateKeyPair(true);

const encryptContext = envelopeContext({ out: keyPair });

const sealed = await v.parseAsync(userProfileSchema(encryptContext), userProfile);
console.log(sealed);
```

Output:

```json
{
  "identity": {
    "ct": "2DPxSEdZWSQo-C6vh3hlxUeGvZQmoDNW6vQt_Y5V9Gp1mu_MaVG7m4HKJ6OtTwxqGnQlv9ZThZkvUe6JVEZmmmug",
    "enc": "BDQSbUX5SI9R70VMDnOHyNh9DEm5a9J4gvPNjD28-FHV45Q9z-C1JUReIE9llMaalakhvL_lV5gA-e8WIm_lv38"
  },
  "height": 180,
  "weight": 70
}
```
