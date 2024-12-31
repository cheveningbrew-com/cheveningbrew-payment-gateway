const express = require('express');
const crypto = require('crypto');
const { client } = require('../PostgreSQL/PostgreSQL_config');
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();

const merchant_id = process.env.MERCHANT_ID;
const merchant_secret = process.env.MERCHANT_SECRET;
const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;

const getEndDateForPlan = (plan, startDate) => {
  let endDate;
  switch (plan) {
    case 'Monthly':
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'Annual':
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
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

router.post('/start', (req, res) => {
  const { order_id, amount, currency } = req.body;
  console.log('Payment request for order:', order_id);

  // Generate the hash value
  const hash = crypto
    .createHash('md5')
    .update(
      merchant_id +
        order_id +
        amount +
        currency +
        crypto
          .createHash('md5')
          .update(merchant_secret)
          .digest('hex')
          .toUpperCase()
    )
    .digest('hex')
    .toUpperCase();

  console.log('Hash generated for order:', order_id);

  res.json({ hash, merchant_id });
});

// Payment notification endpoint
router.post('/notify', async (req, res) => {
  console.log('Payment notification received');

  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig,
    payment_id,
    custom_1,
    custom_2,
  } = req.body;

  const email = custom_1;
  const plan = custom_2;

  const local_md5sig = crypto
    .createHash('md5')
    .update(
      merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        crypto
          .createHash('md5')
          .update(merchant_secret)
          .digest('hex')
          .toUpperCase()
    )
    .digest('hex')
    .toUpperCase();
    
  console.log('Payment notification for email:', email);

  if (local_md5sig === md5sig && status_code == '2') {
    // Payment success - update the database
    console.log('Payment successful for payment id:', payment_id);
    try {
      const startDate = new Date();
      const endDate = getEndDateForPlan(plan, startDate);

      // Check if the user exists
      const userResult = await client.query(
        `SELECT * FROM user_subscriptions WHERE email = $1`,
        [email]
      );

      if (userResult.rows.length > 0) {
        // Update existing user's subscription
        const updateResult = await client.query(
          `UPDATE user_subscriptions
           SET plan = $1, startDate = $2, endDate = $3, isPaid = true, transactionId = $4, updatedAt = NOW()
           WHERE email = $5
           RETURNING *`,
          [plan, startDate, endDate, payment_id, email]
        );

        console.log('Subscription updated successfully:', updateResult.rows[0]);
        res.sendStatus(200);
      } else {
        // Insert new user's subscription
        const insertResult = await client.query(
          `INSERT INTO user_subscriptions (email, plan, startDate, endDate, isPaid, transactionId, createdAt, updatedAt)
           VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())
           RETURNING *`,
          [email, plan, startDate, endDate, payment_id]
        );

        console.log('New subscription added successfully:', insertResult.rows[0]);
        res.sendStatus(201);
      }
    } catch (err) {
      console.error('Error processing subscription:', err);
      res.sendStatus(500);
    }
  } else if (status_code == '2' && order_id === '') {
      // Obtain access token
      const authCode = Buffer.from(`${APP_ID}:${APP_SECRET}`).toString('base64');
      const tokenResponse = await fetch('https://sandbox.payhere.lk/merchant/v1/oauth/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authCode}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
        }),
      });

      if (!tokenResponse.ok) {
        console.error('Failed to get access token');
        return res.status(tokenResponse.status).json({ error: 'Failed to get access token' });
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Log the obtained access token for debugging
      console.log('Obtained access token:', accessToken);

      // Fetch payment details
      const paymentResponse = await fetch(`https://sandbox.payhere.lk/merchant/v1/payment/search?payment_id=${payment_id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!paymentResponse.ok) {
        const errorBody = await paymentResponse.json();
        console.error('Failed to fetch payment details:', errorBody);
        return res.status(paymentResponse.status).json({ error: 'Failed to get payment details' });
      }

      const paymentData = await paymentResponse.json();
      console.log('Payment details fetched successfully:', paymentData);
      const customerEmail = paymentData.data[0]?.customer?.email;
      const customerPlan = paymentData.data[0]?.description;
      const customerPaymentID = paymentData.data[0]?.payment_id;
      console.log('Customer Email:', customerEmail);
      console.log('Customer Plan:', customerPlan);
      console.log('Customer Payment id:', customerPaymentID);
      try {
        const startDate = new Date();
        const endDate = getEndDateForPlan(customerPlan, startDate);
  
        // Check if the user exists
        const userResult = await client.query(
          `SELECT * FROM user_subscriptions WHERE email = $1`,
          [customerEmail]
        );
  
        if (userResult.rows.length > 0) {
          // Update existing user's subscription
          const updateResult = await client.query(
            `UPDATE user_subscriptions
             SET plan = $1, startDate = $2, endDate = $3, isPaid = true, transactionId = $4, updatedAt = NOW()
             WHERE email = $5
             RETURNING *`,
            [customerPlan, startDate, endDate, customerPaymentID, customerEmail]
          );
  
          console.log('Subscription updated successfully via payment link:', updateResult.rows[0]);
          res.sendStatus(200);
        } else {
          // Insert new user's subscription
          const insertResult = await client.query(
            `INSERT INTO user_subscriptions (email, plan, startDate, endDate, isPaid, transactionId, createdAt, updatedAt)
             VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())
             RETURNING *`,
            [customerEmail, customerPlan, startDate, endDate, customerPaymentID]
          );
  
          console.log('New subscription added successfully via payment link:', insertResult.rows[0]);
          res.sendStatus(201);
        }
      } catch (err) {
        console.error('Error processing subscription via payment link:', err);
        res.sendStatus(500);
      }

  } else {
    // Payment verification failed
    console.log('Payment verification failed for payment id:', payment_id);
    res.sendStatus(400);
  }
});


// Route to get an access token from PayHere
router.post('/api/get-token', async (req, res) => {
  try {
    const authCode = Buffer.from(`${APP_ID}:${APP_SECRET}`).toString('base64');

    const tokenResponse = await fetch('https://sandbox.payhere.lk/merchant/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authCode}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
      }),
    });

    if (!tokenResponse.ok) {
        console.log('Failed to get token');
        return res.status(tokenResponse.status).json({ error: 'Failed to get token' });
      
    }

    const tokenData = await tokenResponse.json();
    res.json(tokenData);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
    
  }
});

// Route to get payment details by order ID
router.get('/api/payment-details', async (req, res) => {
  try {
    const { accessToken, orderId } = req.query;
    console.log(accessToken, orderId);

    if (!accessToken || !orderId) {
        console.log('accessToken and orderId are required');
      return res.status(400).json({ error: 'accessToken and orderId are required' });
    }

    const paymentResponse = await fetch(`https://sandbox.payhere.lk/merchant/v1/payment/search?payment_id=${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paymentResponse.ok) {
      const errorBody = await paymentResponse.json();
      console.log('Payment response error:', errorBody);
      return res.status(paymentResponse.status).json({ error: 'Failed to get payment details' });
    }

    const paymentData = await paymentResponse.json();
    res.json(paymentData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
