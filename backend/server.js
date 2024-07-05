import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import {databank,db} from "./database.js";


const app = express();

databank();

app.use(bodyParser.json());
app.use(cors());

app.get('/api/get-data', async (req, res) => {
  try {
    db.all('SELECT * FROM heart_rate', [], (err, heartRates) => {
      if (err) throw err;
      db.all('SELECT * FROM oxygen', [], (err, oxygens) => {
        if (err) throw err;
        db.all('SELECT * FROM raw_data', [], (err, rawData) => {
          if (err) throw err;
          console.log('Data fetched successfully');
          res.send({ heartRates, oxygens, rawData });
        });
      });
    });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send(err);
  }
});

app.post('/api/save-data', async (req, res) => {
  try {
    const { heartRate, bloodOxygen, rawValue1, rawValue2, timestamp } = req.body;

    if (heartRate) {
      db.run('INSERT INTO heart_rate (value, timestamp) VALUES (?, ?)', [heartRate, timestamp], (err) => {
        if (err) throw err;
        console.log(`Heart rate data saved: ${heartRate} at ${timestamp}`);
      });
    }
    if (bloodOxygen) {
      db.run('INSERT INTO oxygen (value, timestamp) VALUES (?, ?)', [bloodOxygen, timestamp], (err) => {
        if (err) throw err;
        console.log(`Oxygen data saved: ${bloodOxygen} at ${timestamp}`);
      });
    }
    if (rawValue1 && rawValue2) {
      db.run('INSERT INTO raw_data (value1, value2, timestamp) VALUES (?, ?, ?)', [rawValue1, rawValue2, timestamp], (err) => {
        if (err) throw err;
        console.log(`Raw data saved: ${rawValue1}, ${rawValue2} at ${timestamp}`);
      });
    }

    res.send({ message: 'Data saved successfully' });
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).send({ error: 'Error saving data', details: err });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
