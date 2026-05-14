#!/bin/bash


echo "Starting ServiceFlow..."

# Load env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Backend
cd backend
if [ ! -d node_modules ]; then
  echo "Installing backend dependencies..."
  npm install
fi

echo "Setting up database..."
psql "$DATABASE_URL" -f db/schema.sql 2>/dev/null || true
psql "$DATABASE_URL" -f db/seed.sql 2>/dev/null || true

echo "Starting backend on port ${PORT:-3003}..."
npm run dev &
BACKEND_PID=$!
cd ..

# Frontend
cd frontend
if [ ! -d node_modules ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo "Starting frontend on port 5173..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "ServiceFlow is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:${PORT:-3003}"
echo "  Login:    admin@demo.com / demo123"
echo ""
echo "Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
