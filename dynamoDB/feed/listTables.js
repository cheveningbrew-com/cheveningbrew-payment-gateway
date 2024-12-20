const { dynamodb } = require('../dynamoDB_config');

const params = {};

dynamodb.listTables(params, function (err, data) {
  if (err) {
    console.error('Error listing tables:', JSON.stringify(err, null, 2));
  } else {
    console.log('Tables:', data.TableNames);
  }
});
