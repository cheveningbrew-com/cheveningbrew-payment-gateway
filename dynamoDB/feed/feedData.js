const fs = require('fs');
const { docClient } = require('../dynamoDB_config');

let users = JSON.parse(fs.readFileSync('dynamoDB/feed/feedData.json', 'utf8'));

users.forEach(function (user) {
  console.log(user);

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

  docClient.put(params, function (err, data) {
    if (err) {
      console.error('Error:', JSON.stringify(err, null, 2));
    } else {
      console.log('PutItem succeeded:', user.userID);
    }
  });
});
