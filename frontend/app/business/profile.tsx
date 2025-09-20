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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Address</Text>
          
          {editing ? (
            <>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Street Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedInfo.physicalAddress.street}
                  onChangeText={(value) => updateAddress('street', value)}
                  placeholder="Enter street address"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedInfo.physicalAddress.city}
                  onChangeText={(value) => updateAddress('city', value)}
                  placeholder="Enter city"
                />
              </View>

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
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
});
