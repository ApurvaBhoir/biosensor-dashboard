const db = require('../db'); // Assuming you have a database connection module

const getAll = async () => {
  const data = await db.query('SELECT * FROM raw_data');
  console.log('Fetched raw data:', data);
  return data;
};

const save = async (value1, value2, timestamp) => {
  const result = await db.query('INSERT INTO raw_data (value1, value2, timestamp) VALUES (?, ?, ?)', [value1, value2, timestamp]);
  console.log(`Saved raw data: ${value1}, ${value2} at ${timestamp}`);
  return result;
};

module.exports = { getAll, save };
