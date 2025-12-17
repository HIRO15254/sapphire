-- Create test database for integration and E2E tests
CREATE DATABASE sapphire_test;

-- Grant all privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE sapphire_test TO postgres;
