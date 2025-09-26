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
import { Customer } from '@/lib';
import { buildUrl } from '@/lib/api-config';
import { authService } from '@/lib/auth-service';
import Button from './button';
import GooglePlacesTextInput from 'react-native-google-places-textinput';

export interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: Customer) => void;
}

export default function AddJobModal({ visible, onClose, onCustomerAdded }: AddCustomerModalProps) {
  // Debug: Check if API key is loaded
  console.log('Google API Key:', process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Loaded' : 'Not loaded');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    address: '',
    price: '',
    frequency: '',
    lat: 0,
    lng: 0,
    estimated_duration: '',
    exterior_windows: true,
    interior_windows: false,
    gutters: false,
    fascias: false,
    payment_status: true,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [customerAddress, setCustomerAddress] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        description: '',
        address: '',
        price: '',
        lat: 0,
        lng: 0,
        frequency: '',
        estimated_duration: '',
        exterior_windows: true,
        interior_windows: false,
        gutters: false,
        fascias: false,
        payment_status: true,
      });
    }
  }, [visible]);

  const handleFrequencySelect = (frequency: string) => {
    setFormData(prev => ({ ...prev, frequency }));
    setShowFrequencyPicker(false);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter customer name');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a service description');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Validation Error', 'Please enter customer address');
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

  const handleCreateCustomer = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const headers = await authService.getAuthHeaders();

      const customerData = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        description: formData.description.trim(),
        address: formData.address.trim(),
        price: parseFloat(formData.price),
        lat: formData.lat,
        lng: formData.lng,
        frequency: formData.frequency,
        estimated_duration: parseInt(formData.estimated_duration) || null,
        payment_status: formData.payment_status,
        exterior_windows: formData.exterior_windows,
        interior_windows: formData.interior_windows,
        gutters: formData.gutters,
        fascias: formData.fascias,
        status: true,
      };

      console.log('🚀 CREATING CUSTOMER WITH DATA:', customerData);
      console.log('📍 Coordinates being sent - LAT:', customerData.lat, 'LNG:', customerData.lng);

      const response = await fetch(buildUrl('/api/customers'), {
        method: 'POST',
        headers,
        body: JSON.stringify(customerData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update the customer list first
        onCustomerAdded(result.data);
        
        // Reset form
        resetForm();
        
        // Close modal immediately
        onClose();
        
        // Show success alert after modal is closed
        setTimeout(() => {
          Alert.alert('Success', 'Customer created successfully!');
        }, 100);
      } else {
        Alert.alert('Error', result.message || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('Error', 'Failed to create customer');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      description: '',
      address: '',
      price: '',
      frequency: '',
      lat: 0,
      lng: 0,
      estimated_duration: '',
      exterior_windows: true,
      interior_windows: false,
      gutters: false,
      fascias: false,
      payment_status: true,
    });
    setCustomerAddress(null);
    setShowFrequencyPicker(false);
  };

  const handleCancel = () => {
    // Check if form has any data
    const hasFormData = formData.name.trim() ||
      formData.email.trim() ||
      formData.phone.trim() ||
      formData.description.trim() ||
      formData.address.trim() ||
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

          <Text style={styles.title}>Add New Customer</Text>

          <View style={styles.headerButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Customer Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Customer Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter customer name..."
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="customer@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Phone (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter phone number..."
                keyboardType="phone-pad"
              />
            </View>

            {/* Address */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Address</Text>
              <View style={styles.googlePlacesContainer}>
                <GooglePlacesTextInput
                  apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}
                  fetchDetails={true}
                  detailsProxyUrl="http://192.168.1.120:3000/api/places-details"
                  onPlaceSelect={(place: any) => {
                    const address = place.text?.text ||
                      place.structuredFormat?.mainText ||
                      place.description ||
                      place.formatted_address ||
                      '';
                    let lat = 0;
                    let lng = 0;
                    if (place.details?.location) {
                      lat = place.details.location.latitude;
                      lng = place.details.location.longitude;
                      console.log('✅ COORDINATES EXTRACTED:', { lat, lng });
                    } else {
                      console.log('❌ NO COORDINATES IN place.details.location');
                      console.log('place.details:', place.details);
                    }

                    console.log('🎯 FINAL COORDINATES - LAT:', lat, 'LNG:', lng);
                    setFormData(prev => ({ ...prev, address, lat, lng }));
                    setCustomerAddress({
                      address,
                      lat,
                      lng
                    });
                  }}
                />
              </View>
            </View>

            {/* Service Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Service Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Describe the service to be provided..."
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
            title={isCreating ? "Creating..." : "Create Customer"}
            onPress={handleCreateCustomer}
            variant="primary"
            size="large"
            style={styles.footerButton}
            disabled={isCreating}
          />
        </View>

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
  // Google Places Input Styles
  googlePlacesContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'relative',
    // Add padding to ensure clear button doesn't overlap with border
    paddingRight: 2,
  },
});
