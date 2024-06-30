import React, { useEffect, useState, useCallback } from 'react';
import mqtt from 'mqtt';

const App = () => {
  const [data, setData] = useState('');
  const [mode, setMode] = useState('pulse');
  const [client, setClient] = useState(null);

  const connectToBroker = useCallback(() => {
    const options = {
      username: 'Projektarbeit',
      password: 'tanjiro',
      protocol: 'wss',
      clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
      reconnectPeriod: 5000, // Reconnect every 5 seconds
    };

    console.log('Attempting to connect to MQTT broker...');
    const mqttClient = mqtt.connect('wss://928f0f4820694d46aca084e5bf5b7e55.s1.eu.hivemq.cloud:8884/mqtt', options);

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      setClient(mqttClient);

      // Delay subscriptions to ensure connection is stable
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
        console.log('Setting data:', payload);
        setData(payload);
      } else if (topic === 'Moduswechsel') {
        const newMode = payload === '1' ? 'raw' : 'pulse';
        console.log('Changing mode to:', newMode);
        setMode(newMode);
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

  return (
    <div>
      <h1>MQTT Web App</h1>
      <button onClick={() => publishModeChange('1')}>Switch to Raw Data Mode</button>
      <button onClick={() => publishModeChange('0')}>Switch to Pulse Data Mode</button>

      <div id="dataDisplay">
        <h2>Data:</h2>
        <div id="dataOutput">
          {mode === 'pulse' ? (
            <div>
              <p>Heart Rate: {data.split(',')[0]} bpm</p>
              <p>Blood Oxygen: {data.split(',')[1]}%</p>
            </div>
          ) : (
            <p>Raw Data: {data}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;