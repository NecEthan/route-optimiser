import React, { useState, useEffect, use } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Button from './button';
import { API_CONFIG } from '@/lib';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserId } from '@/services/sharedService';

type Customer = {
  latitude: string;
  longitude: string;
  id?: string | number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  frequency?: string;
  created_at?: string;
  updated_at?: string;
};

type EditCustomerModalProps = {
  visible: boolean;
  customer: Customer | null;
  onClose: () => void;
  onCustomerUpdated: () => void; // Callback to refresh the customer list
};

export default function EditCustomerModal({
  visible,
  customer,
  onClose,
  onCustomerUpdated,
}: EditCustomerModalProps) {
    
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    userId: '',
    frequency: 'monthly', 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCustomerData = async () => {
      if (customer) {
        const userId = await getUserId();
        setFormData({
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          latitude: customer.latitude || '',
          longitude: customer.longitude || '',
          created_at: customer.created_at || new Date().toISOString(),
          updated_at: customer.updated_at || new Date().toISOString(),
          userId: userId || '',
          frequency: customer.frequency || 'monthly',
        });
      }
    };
    
    loadCustomerData();
  }, [customer]);

  const resetForm = async () => {
    const userId = await getUserId();
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      latitude: '',
      longitude: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      userId: userId || '',
      frequency: 'monthly',
    });
  };

  const handleClose = async () => {
    await resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim() || !formData.address.trim()) {
      Alert.alert('Validation Error', 'Name and address are required fields.');
      return;
    }

    if (!customer?.id) {
      Alert.alert('Error', 'Customer ID is missing.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      const test = {customerId: customer.id, ...formData}
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(test),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        handleClose();
        onCustomerUpdated();
        Alert.alert('Success', 'Customer updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Update customer error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to update customer: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Edit Customer</Text>
          <Button
            title="Cancel"
            onPress={handleClose}
            variant="outline"
            size="small"
          />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Customer name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="customer@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Customer address"
              multiline
              numberOfLines={3}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Frequency</Text>
            <View style={styles.frequencyContainer}>
              {['weekly', 'bi-weekly', 'monthly', 'quarterly'].map((freq) => (
                <Button
                  key={freq}
                  title={freq.charAt(0).toUpperCase() + freq.slice(1)}
                  onPress={() => setFormData({ ...formData, frequency: freq })}
                  variant={formData.frequency === freq ? 'primary' : 'outline'}
                  size="small"
                  style={styles.frequencyButton}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={loading ? 'Updating Customer...' : 'Update Customer'}
            onPress={handleSubmit}
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading}
            length="full"
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    minWidth: '45%',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
