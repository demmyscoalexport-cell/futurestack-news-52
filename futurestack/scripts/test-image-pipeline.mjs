#!/usr/bin/env node
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
}

const { generateAndUpload } = await import("../lib/image-gen.ts");

console.log("WaveSpeed:", !!process.env.WAVESPEED_API_KEY);
console.log("Cloudinary:", !!process.env.CLOUDINARY_CLOUD_NAME && !!process.env.CLOUDINARY_API_KEY);

const result = await generateAndUpload({ type: "tool-logo", name: "TestTool" });
console.log("Pipeline result:", {
  hasGenerated: !!result.generatedUrl,
  hasCloudinary: !!result.cloudinaryUrl,
  finalUrl: result.finalUrl ? result.finalUrl.slice(0, 80) + "..." : null,
});

process.exit(result.finalUrl ? 0 : 1);
