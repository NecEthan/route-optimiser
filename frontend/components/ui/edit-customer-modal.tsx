import React, { useState, useEffect } from 'react';
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

type Customer = {
  id?: string | number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
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
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCustomerData = async () => {
      if (customer) {
        setFormData({
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          latitude: customer.latitude ? customer.latitude.toString() : '',
          longitude: customer.longitude ? customer.longitude.toString() : '',
        });
      }
    };
    
    loadCustomerData();
  }, [customer]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      latitude: '',
      longitude: '',
    });
  };

  const handleClose = () => {
    resetForm();
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
      
      // Only send fields that exist in the database schema
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        latitude: formData.latitude.trim(),
        longitude: formData.longitude.trim(),
      };
      
      console.log('Sending update data:', updateData);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      console.log('Update response:', result);

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
