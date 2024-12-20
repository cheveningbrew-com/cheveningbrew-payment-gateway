const express = require('express');
const { docClient } = require('../dynamoDB/dynamoDB_config.js'); // Import DynamoDB client

const router = express.Router();

// POST endpoint to add a new user
router.post('/add', (req, res) => {
  const user = req.body; // Expecting user data to come from the request body

  // Define parameters for DynamoDB
  const params = {
    TableName: 'Users',
    Item: {
      userID: user.userID,
      email: user.email,
      subscriptions: user.subscriptions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };

  // Insert user into DynamoDB
  docClient.put(params, function (err, data) {
    if (err) {
      console.error('Error adding user:', JSON.stringify(err, null, 2));
      res.status(500).send({ error: 'Could not add user' });
    } else {
      console.log('User added successfully:', JSON.stringify(data, null, 2));
      res.status(200).send({ message: 'User added successfully' });
    }
  });
});

module.exports = router;
