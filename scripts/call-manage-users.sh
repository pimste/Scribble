#!/bin/bash

echo "🚀 Managing users via API..."
echo "==========================================="

# Delete Kind1
echo ""
echo "🗑️  Deleting Kind1..."
curl -X POST http://localhost:3000/api/manage-users \
  -H "Content-Type: application/json" \
  -d '{"action":"delete","username":"Kind1"}' \
  -s | jq '.'

# Delete Kind2
echo ""
echo "🗑️  Deleting Kind2..."
curl -X POST http://localhost:3000/api/manage-users \
  -H "Content-Type: application/json" \
  -d '{"action":"delete","username":"Kind2"}' \
  -s | jq '.'

# Delete Lisa
echo ""
echo "🗑️  Deleting Lisa..."
curl -X POST http://localhost:3000/api/manage-users \
  -H "Content-Type: application/json" \
  -d '{"action":"delete","username":"Lisa"}' \
  -s | jq '.'

# Create Ellen
echo ""
echo "📝 Creating Ellen..."
curl -X POST http://localhost:3000/api/manage-users \
  -H "Content-Type: application/json" \
  -d '{"action":"create","username":"Ellen","password":"testen","email":"ellen@example.com","role":"parent"}' \
  -s | jq '.'

echo ""
echo "==========================================="
echo "✨ User management complete!"


