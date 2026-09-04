import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { seedSchemas } from "../lib/validations";

config({ path: path.resolve(process.cwd(), ".env.local") });

async function readJson(fileName: string) {
  const contents = await readFile(path.resolve(process.cwd(), "data", fileName), "utf8");
  return JSON.parse(contents) as unknown;
}

function collectDates(value: unknown, dates: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectDates(item, dates));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => {
      if (["date", "end_date", "expires", "assigned_date", "deadline"].includes(key) && typeof item === "string") {
        dates.push(item);
      } else {
        collectDates(item, dates);
      }
    });
  }
  return dates;
}

async function main() {
  const datasets = {
    schedules: seedSchemas.schedules.parse(await readJson("schedules.json")),
    rooms: seedSchemas.rooms.parse(await readJson("rooms.json")),
    events: seedSchemas.events.parse(await readJson("events.json")),
    announcements: seedSchemas.announcements.parse(await readJson("announcements.json")),
    assignments: seedSchemas.assignments.parse(await readJson("assignments.json")),
  };

  const dates = collectDates(datasets).sort();
  console.log(
    `Validated seed data: ${datasets.schedules.length} schedules, ${datasets.rooms.length} rooms, ${datasets.events.length} events, ${datasets.announcements.length} announcements, ${datasets.assignments.length} assignments.`,
  );
  console.log(`Seed date range: ${dates.at(0)} to ${dates.at(-1)}.`);

  if (process.argv.includes("--validate-only")) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const [table, rows] of Object.entries(datasets)) {
    const records = rows as unknown as Record<string, unknown>[];
    const { error } = await supabase.from(table).upsert(records, { onConflict: "id" });
    if (error) throw new Error(`Failed to seed ${table}: ${error.message}`);
    console.log(`Seeded ${rows.length} ${table}.`);
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!superAdminEmail) {
    console.log("SUPER_ADMIN_EMAIL is empty; skipped super-admin promotion.");
    return;
  }

  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Failed to list users: ${error.message}`);

  const user = data.users.find((candidate) => candidate.email?.toLowerCase() === superAdminEmail);
  if (!user) {
    console.log(`No auth user found for ${superAdminEmail}; sign up first, then rerun npm run seed.`);
    return;
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: superAdminEmail,
      full_name: String(user.user_metadata.full_name ?? "Super Admin"),
      role: "super_admin",
      requested_role: "student",
      status: "active",
    },
    { onConflict: "id" },
  );
  if (profileError) throw new Error(`Failed to promote super admin: ${profileError.message}`);
  console.log(`Promoted ${superAdminEmail} to super_admin.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});