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

// PUT endpoint to update a user
router.put('/update', (req, res) => {
  const { userID, email, subscriptions } = req.body;

  // Define parameters for DynamoDB
  const params = {
    TableName: 'Users',
    Key: { userID }, // Specify the primary key to identify the item
    UpdateExpression:
      'SET email = :email, subscriptions = :subscriptions, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':email': email,
      ':subscriptions': subscriptions,
      ':updatedAt': new Date().toISOString(),
    },
    ReturnValues: 'ALL_NEW', // Returns the updated item
  };

  // Update user in DynamoDB
  docClient.update(params, function (err, data) {
    if (err) {
      console.error('Error updating user:', JSON.stringify(err, null, 2));
      res.status(500).send({ error: 'Could not update user' });
    } else {
      res
        .status(200)
        .send({ message: 'User updated successfully', data: data.Attributes });
    }
  });
});

// GET endpoint to retrieve all users
router.get('/get', (req, res) => {
  const params = {
    TableName: 'Users',
  };

  docClient.scan(params, function (err, data) {
    if (err) {
      console.error('Error retrieving users:', JSON.stringify(err, null, 2));
      res.status(500).send({ error: 'Could not retrieve users' });
    } else {
      res.status(200).send({ users: data.Items });
    }
  });
});

module.exports = router;
