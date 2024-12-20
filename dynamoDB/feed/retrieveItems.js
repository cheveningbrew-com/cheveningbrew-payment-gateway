const { docClient } = require('../dynamoDB_config');

const params = {
  TableName: 'Users',
};

docClient.scan(params, function (err, data) {
  if (err) {
    console.error('Error scanning table:', JSON.stringify(err, null, 2));
  } else {
    console.log('Users data:', JSON.stringify(data.Items, null, 2));
  }
});
