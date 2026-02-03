#!/usr/bin/env bun

const builds = [
  { entry: "src/index.ts", outdir: "dist" },
  { entry: "src/crypto/index.ts", outdir: "dist/crypto" },
  { entry: "src/schema/valibot.ts", outdir: "dist/schema" },
] as const;

for (const { entry, outdir } of builds) {
  const result = await Bun.build({
    entrypoints: [entry],
    outdir,
    target: "node",
  });

  if (!result.success) {
    console.error(`Failed to build ${entry}`);
    process.exit(1);
  }
}
