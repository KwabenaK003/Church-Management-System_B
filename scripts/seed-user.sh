#!/bin/bash
# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
  exit 1
fi

echo "Attempting to create seed user via Supabase Auth Admin API..."

RESPONSE=$(curl -s -w "\nHTTP_STATUS=%{http_code}" -X POST "${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bubiashe.church",
    "password": "Password123!",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "System Admin",
      "role": "admin"
    }
  }')

BODY=$(echo "$RESPONSE" | sed -e '$ d')
STATUS=$(echo "$RESPONSE" | tail -n1 | cut -d'=' -f2)

if [ "$STATUS" -ge 200 ] && [ "$STATUS" -lt 300 ]; then
  echo "User created successfully!"
  echo "Email: admin@bubiashe.church"
  echo "Password: Password123!"
  echo "Role: admin"
else
  echo "Error creating user (HTTP $STATUS):"
  echo "$BODY"
fi
