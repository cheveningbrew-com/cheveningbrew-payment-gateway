const { dynamodb } = require('../dynamoDB_config');

const params = {
  TableName: 'Users',
  KeySchema: [{ AttributeName: 'userID', KeyType: 'HASH' }],
  AttributeDefinitions: [{ AttributeName: 'userID', AttributeType: 'S' }],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};
dynamodb.createTable(params, function (err, data) {
  if (err) {
    console.error('Error creating table:', JSON.stringify(err, null, 2));
  } else {
    console.log('Table created successfully:', JSON.stringify(data, null, 2));
  }
});
