import React, { useEffect, useState, useCallback, useMemo } from 'react';
import mqtt from 'mqtt';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MAX_DATA_POINTS = 50;

const App = () => {
  const [client, setClient] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [pulseFrequency, setPulseFrequency] = useState(1000); // 1 second default
  const [rawFrequency, setRawFrequency] = useState(100); // 100 ms default
  const [lastUpdateTime, setLastUpdateTime] = useState({ pulse: 0, raw: 0 });
  const [currentMode, setCurrentMode] = useState('pulse');

  const connectToBroker = useCallback(() => {
    const options = {
      username: 'Projektarbeit',
      password: 'tanjiro',
      protocol: 'wss',
      clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
      reconnectPeriod: 5000,
    };

    console.log('Attempting to connect to MQTT broker...');
    const mqttClient = mqtt.connect('wss://928f0f4820694d46aca084e5bf5b7e55.s1.eu.hivemq.cloud:8884/mqtt', options);

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      setClient(mqttClient);

      setTimeout(() => {
        mqttClient.subscribe('Daten', (err) => {
          if (err) console.error('Error subscribing to Daten:', err);
          else console.log('Subscribed to Daten topic');
        });
        mqttClient.subscribe('Moduswechsel', (err) => {
          if (err) console.error('Error subscribing to Moduswechsel:', err);
          else console.log('Subscribed to Moduswechsel topic');
        });
      }, 1000);
    });

    mqttClient.on('message', (topic, message) => {
      const payload = message.toString();
      console.log(`Received message on topic ${topic}:`, payload);
      
      if (topic === 'Daten') {
        updateChartData(payload);
      } else if (topic === 'Moduswechsel') {
        console.log('Mode change received:', payload);
        setCurrentMode(payload === '1' ? 'raw' : 'pulse');
        setChartData([]); // Reset chart data when mode changes
        setLastUpdateTime({ pulse: 0, raw: 0 });
      }
    });

    mqttClient.on('error', (error) => {
      console.error('MQTT client error:', error);
    });

    mqttClient.on('close', () => {
      console.log('MQTT client connection closed');
    });

    return mqttClient;
  }, []);

  const updateChartData = useCallback((newData) => {
    const now = Date.now();
    const mode = newData.includes('\t') ? 'raw' : 'pulse';
    const frequency = mode === 'pulse' ? pulseFrequency : rawFrequency;

    if (now - lastUpdateTime[mode] < frequency) {
      return; // Skip this update if it's too soon
    }

    setLastUpdateTime(prev => ({ ...prev, [mode]: now }));

    setChartData(prevData => {
      let newPoint = { timestamp: now };

      if (mode === 'raw') {
        const [value1, value2] = newData.split('\t');
        newPoint.rawValue1 = parseFloat(value1);
        newPoint.rawValue2 = parseFloat(value2);
      } else {
        const [type, value] = newData.split(' ');
        if (type === '1') {
          newPoint.heartRate = parseFloat(value);
        } else if (type === '2') {
          newPoint.bloodOxygen = parseFloat(value);
        }
      }

      const updatedData = [...prevData, newPoint].slice(-MAX_DATA_POINTS);
      return updatedData;
    });
  }, [pulseFrequency, rawFrequency, lastUpdateTime]);

  useEffect(() => {
    const mqttClient = connectToBroker();

    return () => {
      console.log('Cleaning up MQTT client connection');
      mqttClient.end();
    };
  }, [connectToBroker]);

  const publishModeChange = useCallback((mode) => {
    console.log('Attempting to publish mode change:', mode);
    
    if (client) {
      client.publish('Moduswechsel', mode, (err) => {
        if (err) console.error('Error publishing mode change:', err);
        else console.log('Mode change published successfully');
      });
    } else {
      console.error('MQTT client not connected');
    }
  }, [client]);

  const smoothChartData = useMemo(() => {
    return chartData.map((point, index, array) => {
      if (index === 0) return point;
      const prevPoint = array[index - 1];
      return {
        ...point,
        heartRate: point.heartRate || prevPoint.heartRate,
        bloodOxygen: point.bloodOxygen || prevPoint.bloodOxygen,
        rawValue1: point.rawValue1 || prevPoint.rawValue1,
        rawValue2: point.rawValue2 || prevPoint.rawValue2,
      };
    });
  }, [chartData]);

  return (
    <div>
      <h1>MQTT Data Visualization</h1>
      <button onClick={() => publishModeChange('1')}>Switch Mode</button>
      <div>
        <label>
          Pulse Data Frequency (ms):
          <input 
            type="number" 
            value={pulseFrequency} 
            onChange={(e) => setPulseFrequency(Number(e.target.value))}
            min="100"
          />
        </label>
      </div>
      <div>
        <label>
          Raw Data Frequency (ms):
          <input 
            type="number" 
            value={rawFrequency} 
            onChange={(e) => setRawFrequency(Number(e.target.value))}
            min="10"
          />
        </label>
      </div>
      <div>Current Mode: {currentMode}</div>
      <div id="dataDisplay">
        <h2>Data Visualization:</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={smoothChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              domain={['auto', 'auto']} 
              tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()} 
              scale="time"
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip labelFormatter={(value) => new Date(value).toLocaleTimeString()} />
            <Legend />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="heartRate" 
              stroke="#8884d8" 
              name="Heart Rate (bpm)" 
              dot={false} 
              isAnimationActive={false}
              connectNulls={true}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="bloodOxygen" 
              stroke="#82ca9d" 
              name="Blood Oxygen (%)" 
              dot={false} 
              isAnimationActive={false}
              connectNulls={true}
            />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="rawValue1" 
              stroke="#ff7300" 
              name="Raw Value 1" 
              dot={false} 
              isAnimationActive={false}
              connectNulls={true}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="rawValue2" 
              stroke="#007bff" 
              name="Raw Value 2" 
              dot={false} 
              isAnimationActive={false}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default App;