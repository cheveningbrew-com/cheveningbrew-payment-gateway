const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Client for connecting to the 'paralegaldb' database
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

    // Insert feed data into the user_subscriptions table
    const insertDataQuery = `
      INSERT INTO user_subscriptions (
        email, createdAt, updatedAt, plan, startDate, endDate, isPaid, transactionId
      ) VALUES
        ('user1@example.com', NOW(), NOW(), 'Day_Pass', NOW(), NOW() + INTERVAL '1 day', true, 'txn123'),
        ('user2@example.com', NOW(), NOW(), 'Monthly', NOW(), NOW() + INTERVAL '1 month', true, 'txn124'),
        ('user3@example.com', NOW(), NOW(), 'Annual', NOW(), NOW() + INTERVAL '1 year', false, 'txn125');
    `;
    console.log('Inserting feed data...');
    return client.query(insertDataQuery);
  })
  .then(() => {
    console.log('Feed data inserted successfully');
    client.end();
  })
  .catch((err) => {
    console.error('Error inserting feed data', err.stack);
    client.end();
  });
