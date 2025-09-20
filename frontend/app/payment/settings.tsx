import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Button from "@/components/ui/button";
import { Ionicons } from '@expo/vector-icons';

interface BusinessInfo {
  businessName: string;
  phoneNumber: string;
  emailAddress: string;
  physicalAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export default function PaymentSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: 'Clean Windows Pro',
    phoneNumber: '+1 (555) 123-4567',
    emailAddress: 'contact@cleanwindowspro.com',
    physicalAddress: {
      street: '123 Main Street',
      city: 'Anytown',
      state: 'CA',
      zipCode: '90210',
      country: 'United States'
    }
  });

  const [editedInfo, setEditedInfo] = useState<BusinessInfo>(businessInfo);

  const handleEdit = () => {
    setEditing(true);
    setEditedInfo(businessInfo);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedInfo(businessInfo);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call to save business information
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setBusinessInfo(editedInfo);
      setEditing(false);
      Alert.alert('Success', 'Business information updated successfully!');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessInfo = (field: keyof BusinessInfo, value: string) => {
    setEditedInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateAddress = (field: keyof BusinessInfo['physicalAddress'], value: string) => {
    setEditedInfo(prev => ({
      ...prev,
      physicalAddress: {
        ...prev.physicalAddress,
        [field]: value
      }
    }));
  };

  const formatAddress = (address: BusinessInfo['physicalAddress']) => {
    return `${address.street}\n${address.city}, ${address.state} ${address.zipCode}\n${address.country}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Profile</Text>
        <TouchableOpacity onPress={editing ? handleCancel : handleEdit} style={styles.editButton}>
          <Text style={styles.editButtonText}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Business Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          {/* Business Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Business Name</Text>
            {editing ? (
              <TextInput
                style={styles.textInput}
                value={editedInfo.businessName}
                onChangeText={(value) => updateBusinessInfo('businessName', value)}
                placeholder="Enter business name"
              />
            ) : (
              <Text style={styles.fieldValue}>{businessInfo.businessName}</Text>
            )}
          </View>

          {/* Phone Number */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            {editing ? (
              <TextInput
                style={styles.textInput}
                value={editedInfo.phoneNumber}
                onChangeText={(value) => updateBusinessInfo('phoneNumber', value)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{businessInfo.phoneNumber}</Text>
            )}
          </View>

          {/* Email Address */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            {editing ? (
              <TextInput
                style={styles.textInput}
                value={editedInfo.emailAddress}
                onChangeText={(value) => updateBusinessInfo('emailAddress', value)}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.fieldValue}>{businessInfo.emailAddress}</Text>
            )}
          </View>
        </View>

        {/* Physical Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Address</Text>
          
          {editing ? (
            <>
              {/* Street Address */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Street Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedInfo.physicalAddress.street}
                  onChangeText={(value) => updateAddress('street', value)}
                  placeholder="Enter street address"
                />
              </View>

              {/* City */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedInfo.physicalAddress.city}
                  onChangeText={(value) => updateAddress('city', value)}
                  placeholder="Enter city"
                />
              </View>

              {/* State and Zip Code */}
              <View style={styles.rowContainer}>
                <View style={[styles.fieldContainer, styles.halfWidth]}>
                  <Text style={styles.fieldLabel}>State</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editedInfo.physicalAddress.state}
                    onChangeText={(value) => updateAddress('state', value)}
                    placeholder="State"
                  />
                </View>
                <View style={[styles.fieldContainer, styles.halfWidth]}>
                  <Text style={styles.fieldLabel}>Zip Code</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editedInfo.physicalAddress.zipCode}
                    onChangeText={(value) => updateAddress('zipCode', value)}
                    placeholder="Zip Code"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Country */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Country</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedInfo.physicalAddress.country}
                  onChangeText={(value) => updateAddress('country', value)}
                  placeholder="Enter country"
                />
              </View>
            </>
          ) : (
            <View style={styles.addressContainer}>
              <Text style={styles.addressText}>{formatAddress(businessInfo.physicalAddress)}</Text>
            </View>
          )}
        </View>

        {/* Payment Methods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          
          <TouchableOpacity style={styles.paymentMethodCard}>
            <View style={styles.paymentMethodContent}>
              <Ionicons name="card" size={24} color="#007AFF" />
              <View style={styles.paymentMethodText}>
                <Text style={styles.paymentMethodTitle}>Credit Card</Text>
                <Text style={styles.paymentMethodSubtitle}>•••• •••• •••• 4242</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addPaymentButton}>
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.addPaymentText}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>

        {/* Billing History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing History</Text>
          
          <TouchableOpacity style={styles.billingHistoryCard}>
            <View style={styles.billingHistoryContent}>
              <Ionicons name="document-text-outline" size={24} color="#007AFF" />
              <View style={styles.billingHistoryText}>
                <Text style={styles.billingHistoryTitle}>View Billing History</Text>
                <Text style={styles.billingHistorySubtitle}>Download invoices and receipts</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        {editing && (
          <View style={styles.saveButtonContainer}>
            <Button
              title={loading ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              variant="primary"
              size="large"
              loading={loading}
              disabled={loading}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  halfWidth: {
    flex: 1,
  },
  addressContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  addressText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  paymentMethodCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 15,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  paymentMethodText: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addPaymentText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  billingHistoryCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  billingHistoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  billingHistoryText: {
    flex: 1,
  },
  billingHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  billingHistorySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
});
