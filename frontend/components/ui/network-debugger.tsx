import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { API_CONFIG } from '@/lib';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NetworkDebugger() {
  const [status, setStatus] = useState('Testing...');
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    checkToken();
    testConnection();
  }, []);

  const checkToken = async () => {
    const storedToken = await AsyncStorage.getItem('access_token');
    setToken(storedToken);
  };

  const testConnection = async () => {
    try {
      setStatus('🔄 Testing connection...');
      
      // Test basic connectivity
      const healthResponse = await fetch(`${API_CONFIG.BASE_URL}/health`);
      const healthData = await healthResponse.json();
      
      if (healthResponse.ok) {
        setStatus(`✅ Server connected! Customer count: ${healthData.customerCount}`);
      } else {
        setStatus(`❌ Health check failed: ${healthResponse.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`❌ Connection failed: ${errorMessage}`);
      console.error('Debug test error:', error);
    }
  };

  const testCustomersAPI = async () => {
    try {
      setStatus('🔄 Testing customers API...');
      const storedToken = await AsyncStorage.getItem('access_token');
      
      if (!storedToken) {
        setStatus('❌ No auth token found');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/customers`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus(`✅ Customers API works! Found ${data.data?.length || 0} customers`);
      } else {
        setStatus(`❌ Customers API failed: ${response.status} - ${data.message}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`❌ Customers test failed: ${errorMessage}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Network Debug</Text>
      <Text style={styles.url}>API URL: {API_CONFIG.BASE_URL}</Text>
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.token}>
        Token: {token ? `${token.substring(0, 20)}...` : 'No token'}
      </Text>
      
      <View style={styles.buttons}>
        <Button title="Test Connection" onPress={testConnection} />
        <Button title="Test Customers API" onPress={testCustomersAPI} />
        <Button 
          title="Clear Token" 
          onPress={async () => {
            await AsyncStorage.removeItem('access_token');
            setToken(null);
            Alert.alert('Token cleared', 'Please login again');
          }} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  url: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  token: {
    fontSize: 10,
    color: '#999',
    marginBottom: 10,
  },
  buttons: {
    gap: 10,
  },
});
