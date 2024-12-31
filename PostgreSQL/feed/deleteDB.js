const { Client } = require('pg');
const { client } = require('../PostgreSQL_config');

client
  .connect()
  .then(() => {
    console.log('Connected to PostgreSQL');
    // Drop the database if it exists
    return client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'paralegaldb'
    `);
  })
  .then((res) => {
    if (res.rows.length > 0) {
      // Database exists, proceed with dropping it
      console.log('Database exists, dropping...');
      return client.query('DROP DATABASE paralegaldb');
    } else {
      console.log('Database does not exist');
    }
  })
  .then(() => {
    console.log('Database dropped successfully');
    client.end();
  })
  .catch((err) => {
    console.error('Error executing query', err.stack);
    client.end();
  });
