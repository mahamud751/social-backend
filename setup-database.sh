#!/bin/bash

# Database Setup Script for Production
# This script creates the PostgreSQL database and user for production

set -e

echo "=================================================="
echo "Database Setup for Social Backend"
echo "=================================================="
echo ""

# Configuration
DB_NAME="social_production"
DB_USER="social_user"
DB_PASSWORD="your_strong_password_here"  # Change this!

echo "This script will create:"
echo "  - Database: $DB_NAME"
echo "  - User: $DB_USER"
echo "  - Password: $DB_PASSWORD (CHANGE THIS!)"
echo ""
echo "⚠️  WARNING: Make sure to update DB_PASSWORD before running!"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Check if PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql; then
    echo "Starting PostgreSQL..."
    sudo systemctl start postgresql
fi

# Create database and user
echo ""
echo "Creating database and user..."
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the database and grant schema privileges
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

EOF

echo ""
echo "✓ Database setup complete!"
echo ""
echo "Your DATABASE_URL should be:"
echo "postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"
echo ""
echo "Update your .env file with this connection string."
echo ""
