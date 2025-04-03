cleanup() {
    echo "Shutting down servers..."
    kill $(jobs -p)
    exit
}

trap cleanup SIGINT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting backend server..."
cd "$SCRIPT_DIR/backend"
uvicorn app:app --reload &
BACKEND_PID=$!

echo "Starting frontend server..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo "Both servers are running!"
echo "Press Ctrl+C to stop all servers."

wait $BACKEND_PID $FRONTEND_PID 