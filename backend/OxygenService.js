const db = require('../db'); // Assuming you have a database connection module

const getAll = async () => {
  const data = await db.query('SELECT * FROM oxygen');
  console.log('Fetched oxygen data:', data);
  return data;
};

const save = async (value, timestamp) => {
  const result = await db.query('INSERT INTO oxygen (value, timestamp) VALUES (?, ?)', [value, timestamp]);
  console.log(`Saved oxygen data: ${value} at ${timestamp}`);
  return result;
};

module.exports = { getAll, save };
