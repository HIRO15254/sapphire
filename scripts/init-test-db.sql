-- Create test database if it doesn't exist
-- This script runs on container initialization
SELECT 'CREATE DATABASE sapphire_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sapphire_test')\gexec
