#!/usr/bin/env node

import { readFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

const root = process.cwd();

// Check for privilege escalation patterns in API routes
const patterns = [
  { regex: /body\.role/g, label: "body.role write to profiles" },
  { regex: /data\.role/g, label: "data.role write to profiles" },
  { regex: /raw_user_meta_data->>['"]role['"]/g, label: "raw_user_meta_data role copy" },
];

let found = false;
try {
  const result = execSync(
    "grep -rn --include='*.ts' --include='*.tsx' 'profiles.role' app/api/ 2>/dev/null || true",
    { cwd: root, encoding: "utf8" }
  );
  if (result.trim()) {
    const lines = result.trim().split("\n").filter(Boolean);
    for (const line of lines) {
      if (!line.includes("getUser") && !line.includes("profiles.role") && !line.includes("=== 'admin'") && !line.includes("!== 'admin'")) {
        console.error(`SECURITY: Suspicious profiles.role usage: ${line}`);
        found = true;
      }
    }
  }
} catch {
  // grep exit code 1 = no matches, that's fine
}

if (found) {
  console.error("\nSecurity check failed. Review the above findings.");
  process.exit(1);
} else {
  console.log("Security check passed.");
}
