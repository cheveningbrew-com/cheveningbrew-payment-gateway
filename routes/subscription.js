const express = require('express');
const { Client } = require('pg');
const dotenv = require('dotenv');
const { client } = require('../PostgreSQL/PostgreSQL_config');

dotenv.config();

const router = express.Router();

const getEndDateForPlan = (plan, startDate) => {
  let endDate;
  switch (plan) {
    case 'Monthly':
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'Annual':
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'Day Pass':
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      break;
    default:
      throw new Error('Invalid plan');
  }
  return endDate;
};

// Create a new subscription
router.post('/', async (req, res) => {
  const { email, plan, startDate } = req.body;

  if (!email || !plan || !startDate) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const endDate = getEndDateForPlan(plan, new Date(startDate));

  try {
    // UPSERT: If a record with the same email exists, update it
    const result = await client.query(
      `INSERT INTO user_subscriptions (email, createdAt, updatedAt, plan, startDate, endDate, isPaid, transactionId)
       VALUES ($1, NOW(), NOW(), $2, $3, $4, false, NULL)
       ON CONFLICT (email) DO UPDATE 
       SET plan = EXCLUDED.plan,
           startDate = EXCLUDED.startDate,
           endDate = EXCLUDED.endDate,
           updatedAt = NOW()
       RETURNING *`,
      [
        email,
        plan,
        new Date(startDate),
        endDate,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating or updating subscription', err.stack);
    res.status(500).json({ error: 'Failed to create or update subscription' });
  }
});


// Get all subscriptions
router.get('/', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM user_subscriptions');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching subscriptions', err.stack);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get a subscription by email
router.get('/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const result = await client.query('SELECT * FROM user_subscriptions WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(200).json({ status: 'not_found', message: 'User does not exist' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching subscription by email', err.stack);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Update an existing subscription (mark as paid, etc.)
router.put('/:email', async (req, res) => {
  const { email } = req.params;
  const { isPaid, transactionId } = req.body;


  if (isPaid === undefined || transactionId !== null) {
    return res.status(400).json({ error: 'isPaid and transactionId are required' });
  }

  try {
    const result = await client.query(
      `UPDATE user_subscriptions 
       SET isPaid = $1, transactionId = $2, updatedAt = NOW() 
       WHERE email = $3 RETURNING *`,
      [isPaid, transactionId, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating subscription', err.stack);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Update an existing subscription (startDate, plan)
router.post('/:email', async (req, res) => {
  const { email } = req.params;
  const { startDate, plan } = req.body;

  const endDate = getEndDateForPlan(plan, new Date(startDate));

  if (!startDate || !plan) {
    return res.status(400).json({ error: 'startDate and plan are required' });
  }

  try {
    const result = await client.query(
      `UPDATE user_subscriptions 
       SET plan = $1, startDate = $2, endDate = $3, updatedAt = NOW() 
       WHERE email = $4 RETURNING *`,
      [plan, startDate, endDate, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating subscription', err.stack);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Delete a subscription
router.delete('/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const result = await client.query(
      'DELETE FROM user_subscriptions WHERE email = $1 RETURNING *',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.status(200).json({ message: 'Subscription deleted' });
  } catch (err) {
    console.error('Error deleting subscription', err.stack);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

module.exports = router;
