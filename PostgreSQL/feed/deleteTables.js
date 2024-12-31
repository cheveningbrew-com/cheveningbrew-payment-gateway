const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD,
  port: process.env.PSQL_PORT,
});

client
  .connect()
  .then(() => {
    console.log('Connected to PostgreSQL');

    const dropTablesQuery = `
      DROP TABLE IF EXISTS user_subscriptions CASCADE;
    `;

    console.log('Dropping tables...');
    return client.query(dropTablesQuery);
  })
  .then(() => {
    console.log('Tables dropped successfully');
  })
  .catch((err) => {
    console.error('Error executing query', err.stack);
  })
  .finally(() => {
    client.end();
  });
