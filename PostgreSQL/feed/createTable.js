const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Main client for connecting to the default database
const mainClient = new Client({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.D_PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD,
  port: process.env.PSQL_PORT,
});

mainClient
  .connect()
  .then(() => {
    console.log('Connected to PostgreSQL');

    const checkDatabaseQuery = `
      SELECT 1 FROM pg_database WHERE datname = 'paralegaldb';
    `;
    return mainClient.query(checkDatabaseQuery);
  })
  .then((res) => {
    if (res.rows.length > 0) {
      console.log('Database "paralegaldb" already exists');
      return Promise.resolve();
    } else {
      console.log('Database "paralegaldb" does not exist. Creating it...');
      return mainClient.query('CREATE DATABASE paralegaldb');
    }
  })
  .then(() => {
    console.log('Database check/creation complete. Connecting to "paralegaldb"...');

    const newClient = new Client({
      user: process.env.PSQL_USER,
      host: process.env.PSQL_HOST,
      database: process.env.PSQL_DATABASE,
      password: process.env.PSQL_PASSWORD,
      port: process.env.PSQL_PORT,
    });

    return newClient.connect().then(() => newClient);
  })
  .then((newClient) => {
    console.log('Connected to the "paralegaldb" database');

    const dropTablesQuery = `
      DROP TABLE IF EXISTS user_subscriptions CASCADE;
    `;
    console.log('Dropping existing tables...');
    return newClient.query(dropTablesQuery).then(() => newClient);
  })
  .then((newClient) => {
    console.log('Existing tables dropped successfully');

    const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        email VARCHAR(150) PRIMARY KEY,
        createdAt TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP NOT NULL,
        plan VARCHAR(50) NOT NULL,
        startDate TIMESTAMP NOT NULL,
        endDate TIMESTAMP NOT NULL,
        isPaid BOOLEAN NOT NULL,
        transactionId VARCHAR(50) UNIQUE,
        userType VARCHAR(50) NOT NULL DEFAULT 'Basic',
        identityMangedBy VARCHAR(50) NOT NULL
      );
    `;
    console.log('Creating tables...');
    return newClient.query(createTablesQuery).then(() => newClient);
  })
  .then((newClient) => {
    console.log('Tables created successfully');
    newClient.end();
    mainClient.end();
  })
  .catch((err) => {
    console.error('Error executing query', err.stack);
    mainClient.end();
  });
