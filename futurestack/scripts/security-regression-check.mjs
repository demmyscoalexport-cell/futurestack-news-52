import { readFileSync } from "node:fs";

const sqlSchemas = [
  "supabase/schema.sql",
  "supabase/deploy_schema.sql",
  "supabase/complete_schema.sql",
  "supabase/complete_migration.sql",
  "supabase/complete_setup.sql",
  "supabase/migration_003_profile_role_guard.sql",
];

function readProjectFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const preferencesRoute = readProjectFile("app/api/user/preferences/route.ts");
assert(
  !/\.from\("profiles"\)[\s\S]{0,300}\.update\([\s\S]{0,200}\brole\s*:/.test(
    preferencesRoute,
  ),
  "User preferences route must not update profiles.role",
);

const accountPage = readProjectFile("app/account/page.tsx");
assert(
  !/\.from\("profiles"\)\.upsert\(\{[\s\S]{0,300}\brole\s*:/.test(accountPage),
  "Account profile save must not upsert profiles.role",
);

for (const schemaPath of sqlSchemas) {
  const schema = readProjectFile(schemaPath);

  assert(
    !schema.includes("raw_user_meta_data->>'role'"),
    `${schemaPath} must not trust signup metadata for profiles.role`,
  );
  assert(
    schema.includes("profiles_prevent_role_self_update"),
    `${schemaPath} must install the profiles.role update guard trigger`,
  );
  assert(
    schema.includes("prevent_profile_role_self_update"),
    `${schemaPath} must define the profiles.role update guard function`,
  );
}

console.log("Security regression checks passed.");
