#!/bin/bash

# Create Test Parent Users Script
# This script creates two test parent users: pim-1 and pim-2

echo "🚀 Creating test parent users for Scribble..."
echo ""
echo "You need to set your Supabase Service Role Key first!"
echo "Get it from: Supabase Dashboard > Settings > API > service_role key"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "⚠️  .env.local file not found!"
  echo "Creating .env.local template..."
  cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EOF
  echo "✅ Created .env.local - please fill in your Supabase credentials and run again"
  exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if service role key is set
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" = "your_service_role_key_here" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY not set in .env.local"
  echo ""
  echo "Please add your service role key to .env.local:"
  echo "SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key"
  echo ""
  echo "Get it from: Supabase Dashboard > Settings > API > service_role key"
  exit 1
fi

# Run the Node.js script
node scripts/create-test-parents.js


