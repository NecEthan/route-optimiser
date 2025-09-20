import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import Button from "@/components/ui/button";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const email = await AsyncStorage.getItem('user_email');
      
      setIsLoggedIn(!!token);
      setUserEmail(email);
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await AsyncStorage.multiRemove([
        'access_token',
        'refresh_token',
        'user_email',
        'user_id'
      ]);
      
      setIsLoggedIn(false);
      setUserEmail(null);
      
      console.log('Navigating to /auth/login');
      router.replace('/auth/login');
      
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    console.log('Navigating to login from button');
    router.push('/auth/login');
  };

  const handleBusinessProfile = () => {
    console.log('Navigating to business profile');
    router.push('/payment/settings');
  };

  const handleManageSubscription = () => {
    console.log('Navigating to subscription management');
    router.push('/subscription/manage');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>
        
        <TouchableOpacity style={styles.section} onPress={handleBusinessProfile}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Business Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.section} onPress={handleManageSubscription}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Manage Subscription</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          {isLoggedIn ? (
            <Button
              title={loading ? 'Logging out...' : 'Logout'}
              onPress={handleLogout}
              variant="danger"
              size="large"
              loading={loading}
              disabled={loading}
            />
          ) : (
            <Button
              title="Login"
              onPress={handleLogin}
              variant="primary"
              size="large"
            />
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContainer: {
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  loggedIn: {
    color: '#28a745',
  },
  loggedOut: {
    color: '#dc3545',
  },
  email: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  buttonGroup: {
    gap: 10,
  },
});
