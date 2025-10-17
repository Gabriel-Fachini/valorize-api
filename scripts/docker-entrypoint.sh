#!/bin/sh
set -e

echo "🚀 Starting Valorize API..."

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Check if migrations were successful
if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully"
else
    echo "❌ Database migrations failed"
    exit 1
fi

# Start the application
echo "🎯 Starting application server..."
exec node dist/app.js

