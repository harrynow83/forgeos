#!/bin/bash

echo "🚀 Starting ForgeOS..."

# Ruta base del proyecto
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Levantar backend
echo "🟢 Starting backend..."
cd "$ROOT_DIR/backend"
node server.js &

BACK_PID=$!

# Esperar un poco para que backend arranque
sleep 2

# Levantar frontend
echo "🟡 Starting frontend..."
cd "$ROOT_DIR"
pnpm dev &

FRONT_PID=$!

echo "✅ ForgeOS running!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"

# Mantener procesos vivos
wait $BACK_PID $FRONT_PID