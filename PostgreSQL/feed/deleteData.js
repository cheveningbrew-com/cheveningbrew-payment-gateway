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
    console.log('Connected to the "paralegaldb" database');

    // Delete all rows from the user_subscriptions table
    const deleteDataQuery = `DELETE FROM user_subscriptions;`;
    console.log('Clearing all data from the user_subscriptions table...');
    return client.query(deleteDataQuery);
  })
  .then(() => {
    console.log('All data cleared successfully');
    client.end();
  })
  .catch((err) => {
    console.error('Error clearing data', err.stack);
    client.end();
  });
