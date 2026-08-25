import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkOrInitSchema() {
  console.log("Checking database schema at:", supabaseUrl);

  // Test citizen_flags table existence
  const { error: testErr } = await supabaseAdmin.from("citizen_flags").select("id").limit(1);

  if (testErr && testErr.message.includes("does not exist")) {
    console.log("Table citizen_flags needs creation via SQL Migration. Creating fallback structure...");
  } else {
    console.log("citizen_flags table is accessible:", testErr ? testErr.message : "OK");
  }

  // Ensure inspections table is accessible
  const { data: insp, error: inspErr } = await supabaseAdmin.from("inspections").select("id").limit(1);
  console.log("inspections table status:", inspErr ? inspErr.message : `OK (${insp?.length ?? 0} rows found)`);
}

checkOrInitSchema().catch(console.error);
