#!/bin/bash

# Exit on error
set -e

echo "================================"
echo "🚀 Shop Manager Backend Starting"
echo "================================"
echo ""
echo "📊 Configuration:"
echo "  • Database: ${DB_HOST}:${DB_PORT}"
echo "  • Database Name: ${POSTGRES_DB}"
echo "  • Debug Mode: ${DEBUG:-True}"
echo "  • Backend Port: ${BACKEND_PORT:-8000} (container internal: 8000)"
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
while ! pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${POSTGRES_USER}" > /dev/null 2>&1; do
    echo "   PostgreSQL is unavailable - sleeping"
    sleep 1
done
echo "✅ PostgreSQL is up and running!"

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Create cache table if it doesn't exist
echo "Creating cache table..."
python manage.py createcachetable || true

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if it doesn't exist (optional, for development)
if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ] && [ "$DJANGO_SUPERUSER_EMAIL" ]; then
    echo "Checking for superuser..."
    python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists():
    User.objects.create_superuser('$DJANGO_SUPERUSER_USERNAME', '$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD')
    print('Superuser created.')
else:
    print('Superuser already exists.')
END
fi

echo ""
echo "================================"
echo "✅ Entrypoint script completed!"
echo "================================"
echo ""

# Execute the main command
exec "$@"
