const { dynamodb } = require('../dynamoDB_config');

const params = {
  TableName: 'Users',
};

dynamodb.describeTable(params, function (err, data) {
  if (err) {
    console.error('Error describing table:', JSON.stringify(err, null, 2));
  } else {
    console.log('Table details:', JSON.stringify(data, null, 2));
  }
});
