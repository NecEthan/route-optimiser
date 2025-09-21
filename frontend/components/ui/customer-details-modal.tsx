import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Button from './button';

type Customer = {
  id?: string | number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  frequency?: string;
  created_at?: string;
  updated_at?: string;
};

type CustomerDetailsModalProps = {
  visible: boolean;
  customer: Customer | null;
  onClose: () => void;
  onEdit?: (customer: Customer) => void;
};

export default function CustomerDetailsModal({
  visible,
  customer,
  onClose,
  onEdit,
}: CustomerDetailsModalProps) {
  if (!customer) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const handleEdit = () => {
    onEdit?.(customer);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Customer Details</Text>
          <Button
            title="Close"
            onPress={onClose}
            variant="outline"
            size="small"
          />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.fieldValue}>{customer.name}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Address</Text>
              <Text style={styles.fieldValue}>{customer.address}</Text>
            </View>

            {customer.phone && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <Text style={styles.fieldValue}>📞 {customer.phone}</Text>
              </View>
            )}

            {customer.email && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.fieldValue}>✉️ {customer.email}</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Information</Text>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Service Frequency</Text>
              <Text style={styles.fieldValue}>
                {customer.frequency ? 
                  customer.frequency.charAt(0).toUpperCase() + customer.frequency.slice(1) : 
                  'Not specified'
                }
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Customer ID</Text>
              <Text style={styles.fieldValue}>{customer.id || 'N/A'}</Text>
            </View>
          </View>

          {(customer.created_at || customer.updated_at) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              
              {customer.created_at && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Customer Since</Text>
                  <Text style={styles.fieldValue}>{formatDate(customer.created_at)}</Text>
                </View>
              )}

              {customer.updated_at && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Last Updated</Text>
                  <Text style={styles.fieldValue}>{formatDate(customer.updated_at)}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {onEdit && (
          <View style={styles.footer}>
            <Button
              title="Edit Customer"
              onPress={handleEdit}
              variant="primary"
              size="large"
              length="full"
            />
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
