#!/bin/bash
# deploy.sh - Main deployment script

set -e

echo "🚀 Starting Inventory Management App Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create project directory
PROJECT_NAME="inventory-management-app"
echo "📁 Creating project directory: $PROJECT_NAME"

if [ -d "$PROJECT_NAME" ]; then
    echo "⚠️  Project directory already exists. Continue? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Create directory structure
echo "📂 Creating directory structure..."
mkdir -p {inventory_project,inventory,frontend/src/components,frontend/public}

# Create Django project files
echo "🐍 Creating Django configuration..."

# Create requirements.txt
cat > requirements.txt << 'EOF'
Django==4.2.7
djangorestframework==3.14.0
django-cors-headers==4.3.1
django-filter==23.3
psycopg2-binary==2.9.7
python-decouple==3.8
Pillow==10.0.1
EOF
# gunicorn==21.2.0

# Create manage.py
cat > manage.py << 'EOF'
#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory_project.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
EOF

chmod +x manage.py

# Create Django settings
cat > inventory_project/__init__.py << 'EOF'
EOF

cat > inventory_project/wsgi.py << 'EOF'
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory_project.settings')
application = get_wsgi_application()
EOF

cat > inventory_project/asgi.py << 'EOF'
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory_project.settings')
application = get_asgi_application()
EOF

# Create inventory app
cat > inventory/__init__.py << 'EOF'
EOF

cat > inventory/apps.py << 'EOF'
from django.apps import AppConfig

class InventoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inventory'
EOF

# Create frontend package.json
cat > frontend/package.json << 'EOF'
{
  "name": "inventory-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "axios": "^1.6.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "react-hook-form": "^7.47.0",
    "react-select": "^5.8.0",
    "react-table": "^7.8.0",
    "@tailwindcss/forms": "^0.5.6",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "devDependencies": {
    "react-scripts": "5.0.1",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

# Create Tailwind config
cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'arabic': ['Tahoma', 'Arial', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
EOF

# Create PostCSS config
cat > frontend/postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create React index files
cat > frontend/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="نظام إدارة المخزون للمتاجر الصغيرة" />
    <title>نظام إدارة المخزون</title>
    <style>
      body {
        font-family: 'Segoe UI', 'Tahoma', 'Arial', 'Helvetica Neue', sans-serif;
        direction: rtl;
      }
    </style>
  </head>
  <body>
    <noscript>تحتاج إلى تفعيل JavaScript لتشغيل هذا التطبيق.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

cat > frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Create environment files
cat > .env.example << 'EOF'
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here

# Database Settings
POSTGRES_DB=inventory_db
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=inventory_pass
DB_HOST=db
DB_PORT=5432

# Frontend Settings
REACT_APP_API_URL=http://localhost:8000/api
EOF

cp .env.example .env

# Create initialization script
cat > init.sh << 'EOF'
#!/bin/bash
set -e

echo "🔧 Initializing Inventory Management App..."

# Wait for database
echo "⏳ Waiting for database..."
python manage.py migrate --run-syncdb

# Create superuser if it doesn't exist
echo "👤 Creating admin user..."
python manage.py shell << PYTHON_SCRIPT
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('✅ Admin user created: admin/admin123')
else:
    print('ℹ️ Admin user already exists')
PYTHON_SCRIPT

# Load sample data
echo "📦 Loading sample data..."
python manage.py load_sample_data

echo "✅ Initialization complete!"
EOF

chmod +x init.sh

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting Inventory Management App..."

# Build and start containers
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 10

# Initialize the application
echo "🔧 Running initialization..."
docker-compose exec web ./init.sh

echo "✅ Application is ready!"
echo ""
echo "🌐 Access your application at:"
echo "   Frontend: http://localhost:8000"
echo "   Admin Panel: http://localhost:8000/admin"
echo ""
echo "👤 Default login credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📊 To stop the application, run: docker-compose down"
EOF

chmod +x start.sh

# Create stop script
cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Inventory Management App..."
docker-compose down
echo "✅ Application stopped."
EOF

chmod +x stop.sh

# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="inventory_backup_${TIMESTAMP}.sql"

mkdir -p $BACKUP_DIR

echo "💾 Creating database backup..."
docker-compose exec db pg_dump -U inventory_user inventory_db > "$BACKUP_DIR/$BACKUP_FILE"

echo "✅ Backup created: $BACKUP_DIR/$BACKUP_FILE"
EOF

chmod +x backup.sh

# Create restore script
cat > restore.sh << 'EOF'
#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    echo "Available backups:"
    ls -la backups/
    exit 1
fi

BACKUP_FILE=$1

echo "🔄 Restoring database from $BACKUP_FILE..."
docker-compose exec -T db psql -U inventory_user -d inventory_db < "$BACKUP_FILE"

echo "✅ Database restored successfully!"
EOF

chmod +x restore.sh

echo ""
echo "✅ Project structure created successfully!"
echo ""
echo "📁 Project location: $(pwd)"
echo ""
echo "🚀 Next steps:"
echo "1. Copy the Django and React code from the artifacts to their respective directories"
echo "2. Run: ./start.sh"
echo "3. Access your app at http://localhost:8000"
echo ""
echo "📚 Available commands:"
echo "   ./start.sh    - Start the application"
echo "   ./stop.sh     - Stop the application"
echo "   ./backup.sh   - Create database backup"
echo "   ./restore.sh  - Restore database"
echo ""
echo "🎉 Happy coding!"

