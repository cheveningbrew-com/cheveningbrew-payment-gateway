const express = require('express');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();

const merchant_id = process.env.MERCHANT_ID;
const merchant_secret = process.env.MERCHANT_SECRET;

if (!merchant_id || !merchant_secret) {
  console.error('MERCHANT_ID or MERCHANT_SECRET is not set in the environment variables.');
  process.exit(1);
}

router.post('/start', (req, res) => {
  const { order_id, amount, currency } = req.body;
  console.log('Payment request for order:', order_id);

  if (!order_id || !amount || !currency) {
    return res.status(400).json({ error: 'Missing required fields: order_id, amount, currency' });
  }

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

module.exports = router;