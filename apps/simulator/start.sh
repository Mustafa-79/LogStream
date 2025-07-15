#!/bin/bash
# Start the main simulator
npx ts-node index.ts &

# If this is app5, also start the log-fetcher
if [ "$APP_NAME" = "app5" ]; then
    echo "Starting log-fetcher for app5..."
        npx ts-node log-fetcher.ts &
        fi
        
# Wait for all background processes
wait