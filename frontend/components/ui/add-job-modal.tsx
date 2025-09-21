import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerService, Customer } from '@/lib';
import { buildUrl } from '@/lib/api-config';
import { authService } from '@/lib/auth-service';
import Button from './button';

export interface Job {
  id: string; // UUID
  customer_id?: string; // UUID foreign key
  user_id?: string; // UUID foreign key
  description: string; // text not null
  price: number; // numeric(10,2) not null
  frequency?: string; // character varying(50), default 'monthly'
  last_completed?: string; // date
  estimated_duration?: number | null; // integer (minutes)
  active?: boolean; // boolean, default true
  created_at?: string; // timestamp with time zone
  updated_at?: string; // timestamp with time zone
  // Customer information from join
  customers?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address: string;
  };
  // Legacy fields for backward compatibility
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  service_frequency?: string;
  notes?: string;
  completed?: boolean;
  completed_at?: string;
}

export interface AddJobModalProps {
  visible: boolean;
  onClose: () => void;
  onJobAdded: (job: Job) => void;
}

export default function AddJobModal({ visible, onClose, onJobAdded }: AddJobModalProps) {
  const [formData, setFormData] = useState({
    customer_id: '',
    customerName: '',
    description: '',
    price: '',
    frequency: '',
    estimated_duration: '',
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchCustomers();
      // Reset form when modal opens
      setFormData({
        customer_id: '',
        customerName: '',
        description: '',
        price: '',
        frequency: '',
        estimated_duration: '',
      });
    }
  }, [visible]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      console.log('🔍 Fetching customers using customerService...');
      
      const customers = await customerService.getAllCustomers();
      console.log('� Customer service response:', customers);

      setCustomers(customers);
      console.log('✅ Set customers:', customers.length, 'customers loaded');
    } catch (error) {
      console.error('💥 Error fetching customers:', error);
      Alert.alert('Error', 'Failed to load customers. Please check your internet connection and login status.');
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({ 
      ...prev, 
      customer_id: customer.id,
      customerName: customer.name
    }));
    setShowCustomerPicker(false);
  };

  const handleFrequencySelect = (frequency: string) => {
    setFormData(prev => ({ ...prev, frequency }));
    setShowFrequencyPicker(false);
  };

  const validateForm = () => {
    if (!formData.customer_id) {
      Alert.alert('Validation Error', 'Please select a customer');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a job description');
      return false;
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return false;
    }
    if (!formData.frequency) {
      Alert.alert('Validation Error', 'Please select a frequency');
      return false;
    }
    return true;
  };

  const handleCreateJob = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const headers = await authService.getAuthHeaders();
      
      // Don't send user_id - backend will use authenticated user
      const jobData = {
        customer_id: formData.customer_id,
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        frequency: formData.frequency,
        estimated_duration: parseInt(formData.estimated_duration) || null,
      };

      console.log('Creating job with data:', jobData);

      const response = await fetch(buildUrl('/api/jobs'), {
        method: 'POST',
        headers,
        body: JSON.stringify(jobData),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Server response:', result);

      if (response.ok && result.success) {
        Alert.alert('Success', 'Job created successfully!');
        onJobAdded(result.job);
        onClose();
      } else {
        Alert.alert('Error', result.message || 'Failed to create job');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      Alert.alert('Error', 'Failed to create job');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    // Check if form has any data
    const hasFormData = formData.customer_id || 
                       formData.description.trim() || 
                       formData.price || 
                       formData.frequency || 
                       formData.estimated_duration;

    if (hasFormData) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to cancel? All changes will be lost.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      // No form data, close directly
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Add New Job</Text>
          
          <View style={styles.headerButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Customer Selection */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Select Customer</Text>
              {loadingCustomers ? (
                <Text style={styles.loadingText}>Loading customers...</Text>
              ) : (
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setShowCustomerPicker(true)}
                >
                  <Text style={[styles.pickerText, !formData.customerName && styles.placeholderText]}>
                    {formData.customerName || 'Choose a customer...'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              )}
              
              {formData.customer_id && (
                <View style={styles.customerPreview}>
                  {customers.find(c => c.id === formData.customer_id)?.address && (
                    <Text style={styles.customerPreviewText}>
                      📍 {customers.find(c => c.id === formData.customer_id)?.address}
                    </Text>
                  )}
                  {customers.find(c => c.id === formData.customer_id)?.phone && (
                    <Text style={styles.customerPreviewText}>
                      📞 {customers.find(c => c.id === formData.customer_id)?.phone}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Job Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Job Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter job description..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Price */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Price ($)</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Frequency */}
            <View style={styles.fieldContainer}>
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

            {/* Estimated Duration */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Estimated Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={formData.estimated_duration}
                onChangeText={(text) => setFormData(prev => ({ ...prev, estimated_duration: text }))}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Cancel"
            onPress={handleCancel}
            variant="outline"
            size="large"
            style={styles.footerButton}
          />
          <Button
            title={isCreating ? "Creating..." : "Create Job"}
            onPress={handleCreateJob}
            variant="primary"
            size="large"
            style={styles.footerButton}
            disabled={isCreating}
          />
        </View>

        {/* Customer Picker Modal */}
        {showCustomerPicker && (
          <View style={styles.dropdownOverlay}>
            <TouchableOpacity 
              style={styles.dropdownBackdrop}
              onPress={() => setShowCustomerPicker(false)}
            />
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Select Customer</Text>
                <TouchableOpacity
                  onPress={() => setShowCustomerPicker(false)}
                  style={styles.dropdownCloseButton}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
                {customers.map((customer) => (
                  <TouchableOpacity
                    key={customer.id}
                    style={styles.dropdownOption}
                    onPress={() => handleCustomerSelect(customer)}
                  >
                    <View style={styles.customerOptionContent}>
                      <Text style={styles.dropdownOptionText}>{customer.name}</Text>
                      {customer.address && (
                        <Text style={styles.dropdownOptionSubtext}>{customer.address}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

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
                {['weekly', 'biweekly', 'monthly', 'quarterly', 'one-time'].map((freq) => (
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
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  fieldContainer: {
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 80,
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
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    padding: 12,
  },
  customerPreview: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
  },
  customerPreviewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    marginBottom: 0,
  },
  // Compact Dropdown Styles
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
    top: 200,
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
  customerOptionContent: {
    flex: 1,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownOptionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  // Legacy Picker Modal Styles (kept for backward compatibility)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  pickerCloseButton: {
    padding: 4,
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  pickerOptionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
