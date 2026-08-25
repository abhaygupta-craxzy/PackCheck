import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedAccounts() {
  console.log("Connecting to Supabase at:", supabaseUrl);

  const demoUsers = [
    {
      email: "officer@packcheck.in",
      password: "Pack@123",
      role: "investigator",
      fullName: "Officer R. Sharma",
      designation: "Legal Metrology Inspector",
      badgeNumber: "LM-INSP-2026-088",
    },
    {
      email: "user@packcheck.in",
      password: "User@123",
      role: "consumer",
      fullName: "Citizen Consumer",
      designation: "Consumer",
      badgeNumber: null,
    },
  ];

  for (const user of demoUsers) {
    console.log(`\nProcessing account: ${user.email}...`);

    // 1. Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === user.email);

    let userId = null;

    if (existing) {
      console.log(`User ${user.email} exists (ID: ${existing.id}). Updating password and metadata...`);
      const { data: updatedUser, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        existing.id,
        {
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName,
            role: user.role,
            designation: user.designation,
          },
        }
      );

      if (updateErr) {
        console.error(`Error updating ${user.email}:`, updateErr.message);
        continue;
      }
      userId = updatedUser.user.id;
    } else {
      console.log(`Creating user ${user.email}...`);
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          role: user.role,
          designation: user.designation,
        },
      });

      if (createErr) {
        console.error(`Error creating ${user.email}:`, createErr.message);
        continue;
      }
      userId = newUser.user.id;
    }

    console.log(`Auth user configured: ${userId}`);

    // 2. Upsert matching profile in public.profiles
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: user.email,
          full_name: user.fullName,
          role: user.role,
          designation: user.designation,
          badge_number: user.badgeNumber,
          is_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profileErr) {
      console.warn(`Profile upsert notice for ${user.email}:`, profileErr.message);
    } else {
      console.log(`Profile synced for ${user.email} (Role: ${user.role})`);
    }
  }

  console.log("\n✅ All demo accounts seeded successfully into Supabase Auth & Profiles!");
}

seedAccounts().catch((err) => {
  console.error("Fatal seed error:", err);
});
