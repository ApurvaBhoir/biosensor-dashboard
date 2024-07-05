const db = require('../db'); // Assuming you have a database connection module

const getAll = async () => {
  const data = await db.query('SELECT * FROM heart_rate');
  console.log('Fetched heart rate data:', data);
  return data;
};

const save = async (value, timestamp) => {
  const result = await db.query('INSERT INTO heart_rate (value, timestamp) VALUES (?, ?)', [value, timestamp]);
  console.log(`Saved heart rate data: ${value} at ${timestamp}`);
  return result;
};

module.exports = { getAll, save };
