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
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './button';
import { API_CONFIG } from '@/lib';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Customer = {
  id?: string | number;
  name: string;
  email?: string;
  phone?: string;
  description: string;
  address: string;
  price: number;
  frequency?: string;
  estimated_duration?: number;
  last_completed?: string;
  payment_status: boolean;
  exterior_windows: boolean;
  interior_windows: boolean;
  gutters: boolean;
  fascias: boolean;
  status: boolean;
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
    description: '',
    address: '',
    price: '',
    frequency: '',
    estimated_duration: '',
    payment_status: false,
    exterior_windows: false,
    interior_windows: false,
    gutters: false,
    fascias: false,
    status: true,
  });
  const [loading, setLoading] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  useEffect(() => {
    const loadCustomerData = async () => {
      if (customer) {
        setFormData({
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          description: customer.description || '',
          address: customer.address || '',
          price: customer.price?.toString() || '',
          frequency: customer.frequency || '',
          estimated_duration: customer.estimated_duration?.toString() || '',
          payment_status: customer.payment_status || false,
          exterior_windows: customer.exterior_windows || false,
          interior_windows: customer.interior_windows || false,
          gutters: customer.gutters || false,
          fascias: customer.fascias || false,
          status: customer.status !== undefined ? customer.status : true,
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
      description: '',
      address: '',
      price: '',
      frequency: '',
      estimated_duration: '',
      payment_status: false,
      exterior_windows: false,
      interior_windows: false,
      gutters: false,
      fascias: false,
      status: true,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFrequencySelect = (frequency: string) => {
    setFormData(prev => ({ ...prev, frequency }));
    setShowFrequencyPicker(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim() || !formData.address.trim()) {
      Alert.alert('Validation Error', 'Name and address are required fields.');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Service description is required.');
      return;
    }

    if (!formData.price || isNaN(parseFloat(formData.price))) {
      Alert.alert('Validation Error', 'Please enter a valid price.');
      return;
    }

    if (!customer?.id) {
      Alert.alert('Error', 'Customer ID is missing.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      // Send all customer schema fields
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        description: formData.description.trim(),
        address: formData.address.trim(),
        price: parseFloat(formData.price),
        frequency: formData.frequency || null,
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
        payment_status: formData.payment_status,
        exterior_windows: formData.exterior_windows,
        interior_windows: formData.interior_windows,
        gutters: formData.gutters,
        fascias: formData.fascias,
        status: formData.status,
      };
      
      console.log('Sending update data:', updateData);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      console.log('PATCH update response:', result);

      if (response.ok && result.success) {
        Alert.alert('Success', 'Customer updated successfully!');
        onCustomerUpdated(); // Refresh the customer list
        handleClose(); // Close the modal
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
          {/* Customer Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            
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
          </View>

          {/* Service Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe the service to be provided..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price ($) *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frequency</Text>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setShowFrequencyPicker(true)}
              >
                <Text style={[styles.pickerText, !formData.frequency && styles.placeholderText]}>
                  {formData.frequency || 'Select frequency...'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={formData.estimated_duration}
                onChangeText={(text) => setFormData({ ...formData, estimated_duration: text })}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Service Types Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Types</Text>
            
            <View style={styles.switchGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Exterior Windows</Text>
                <Switch
                  value={formData.exterior_windows}
                  onValueChange={(value) => setFormData({ ...formData, exterior_windows: value })}
                  trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                  thumbColor={formData.exterior_windows ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Interior Windows</Text>
                <Switch
                  value={formData.interior_windows}
                  onValueChange={(value) => setFormData({ ...formData, interior_windows: value })}
                  trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                  thumbColor={formData.interior_windows ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Gutters</Text>
                <Switch
                  value={formData.gutters}
                  onValueChange={(value) => setFormData({ ...formData, gutters: value })}
                  trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                  thumbColor={formData.gutters ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Fascias</Text>
                <Switch
                  value={formData.fascias}
                  onValueChange={(value) => setFormData({ ...formData, fascias: value })}
                  trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                  thumbColor={formData.fascias ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>
          </View>

          {/* Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            
            <View style={styles.switchGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Payment Status (Paid)</Text>
                <Switch
                  value={formData.payment_status}
                  onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                  trackColor={{ false: '#e0e0e0', true: '#28a745' }}
                  thumbColor={formData.payment_status ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Active Customer</Text>
                <Switch
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                  thumbColor={formData.status ? '#fff' : '#f4f3f4'}
                />
              </View>
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

      {/* Frequency Picker Modal */}
      {showFrequencyPicker && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity 
            style={styles.dropdownBackdrop}
            onPress={() => setShowFrequencyPicker(false)}
          />
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Frequency</Text>
              <TouchableOpacity
                onPress={() => setShowFrequencyPicker(false)}
                style={styles.dropdownCloseButton}
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.dropdownList}>
              {['4 weeks', '6 weeks', '12 weeks', 'one-time'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={styles.dropdownOption}
                  onPress={() => handleFrequencySelect(freq)}
                >
                  <Text style={styles.dropdownOptionText}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1).replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
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
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#999',
  },
  switchGroup: {
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  // Dropdown styles
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 300,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dropdownCloseButton: {
    padding: 4,
    borderRadius: 4,
  },
  dropdownList: {
    maxHeight: 180,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});
