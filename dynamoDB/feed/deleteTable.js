const { dynamodb } = require('../dynamoDB_config');

const params = {
  TableName: 'Users',
};

dynamodb.deleteTable(params, function (err, data) {
  if (err) {
    console.error('Error deleting table:', JSON.stringify(err, null, 2));
  } else {
    console.log('Table deleted successfully:', JSON.stringify(data, null, 2));
  }
});
