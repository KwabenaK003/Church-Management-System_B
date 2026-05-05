const fs = require('fs');
if (fs.existsSync('.env')) {
  const envConfig = fs.readFileSync('.env', 'utf-8').split('\n');
  envConfig.forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...value] = line.split('=');
      process.env[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
    }
  });
}
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  const email = "admin@bubiashe.church";
  const password = "Password123!";
  
  console.log(`Attempting to create user: ${email}...`);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "System Admin",
      role: "admin"
    }
  });

  if (error) {
    console.error("Error creating user:", error.message);
  } else {
    console.log("User created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Role: admin");
  }
}

seed();
