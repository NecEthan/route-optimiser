import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Button from "@/components/ui/button";
import { Ionicons } from '@expo/vector-icons';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex' | 'discover';
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  holderName: string;
}

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceNumber: string;
  description: string;
}

export default function PaymentSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'visa',
      lastFour: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
      holderName: 'John Doe'
    },
    {
      id: '2',
      type: 'mastercard',
      lastFour: '5555',
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false,
      holderName: 'John Doe'
    }
  ]);

  const [billingHistory] = useState<BillingHistoryItem[]>([
    {
      id: '1',
      date: '2025-09-01',
      amount: 9.99,
      status: 'paid',
      invoiceNumber: 'INV-2025-001',
      description: 'Basic Plan - Monthly'
    },
    {
      id: '2',
      date: '2025-08-01',
      amount: 9.99,
      status: 'paid',
      invoiceNumber: 'INV-2025-002',
      description: 'Basic Plan - Monthly'
    },
    {
      id: '3',
      date: '2025-07-01',
      amount: 9.99,
      status: 'paid',
      invoiceNumber: 'INV-2025-003',
      description: 'Basic Plan - Monthly'
    }
  ]);

  const getCardIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      case 'amex':
        return 'card';
      case 'discover':
        return 'card';
      default:
        return 'card';
    }
  };

  const getCardName = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'American Express';
      case 'discover':
        return 'Discover';
      default:
        return 'Credit Card';
    }
  };

  const handleAddPaymentMethod = () => {
    Alert.alert('Add Payment Method', 'This would open a secure card entry form.');
  };

  const handleUpdateCard = (cardId: string) => {
    Alert.alert('Update Card', `This would open an update form for card ending in ${paymentMethods.find(p => p.id === cardId)?.lastFour}`);
  };

  const handleSetDefaultCard = async (cardId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPaymentMethods(prev => 
        prev.map(method => ({
          ...method,
          isDefault: method.id === cardId
        }))
      );
      
      Alert.alert('Success', 'Default payment method updated!');
    } catch (error) {
      console.error('Set default error:', error);
      Alert.alert('Error', 'Failed to update default payment method.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCard = (cardId: string) => {
    const card = paymentMethods.find(p => p.id === cardId);
    if (card?.isDefault && paymentMethods.length > 1) {
      Alert.alert('Error', 'Cannot remove default payment method. Please set another card as default first.');
      return;
    }

    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove the card ending in ${card?.lastFour}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(method => method.id !== cardId));
            Alert.alert('Success', 'Payment method removed.');
          }
        }
      ]
    );
  };

  const handleDownloadInvoice = (invoiceNumber: string) => {
    Alert.alert('Download Invoice', `This would download invoice ${invoiceNumber}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: BillingHistoryItem['status']) => {
    switch (status) {
      case 'paid':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'failed':
        return '#dc3545';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: BillingHistoryItem['status']) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Payment Methods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          
          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.paymentMethodCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Ionicons name={getCardIcon(method.type)} size={24} color="#007AFF" />
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardType}>{getCardName(method.type)}</Text>
                    <Text style={styles.cardNumber}>•••• •••• •••• {method.lastFour}</Text>
                    <Text style={styles.cardExpiry}>
                      Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                    </Text>
                  </View>
                </View>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardActions}>
                <Button
                  title="Update Card"
                  onPress={() => handleUpdateCard(method.id)}
                  variant="secondary"
                  size="small"
                />
                
                {!method.isDefault && (
                  <Button
                    title="Set as Default"
                    onPress={() => handleSetDefaultCard(method.id)}
                    variant="outline"
                    size="small"
                    loading={loading}
                    disabled={loading}
                  />
                )}
                
                <TouchableOpacity
                  onPress={() => handleRemoveCard(method.id)}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash-outline" size={16} color="#dc3545" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addPaymentButton} onPress={handleAddPaymentMethod}>
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.addPaymentText}>Add New Payment Method</Text>
          </TouchableOpacity>
        </View>

        {/* Billing Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Information</Text>
          <View style={styles.billingInfoCard}>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Next billing date:</Text>
              <Text style={styles.billingValue}>Dec 20, 2025</Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Billing cycle:</Text>
              <Text style={styles.billingValue}>Monthly</Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Current amount:</Text>
              <Text style={styles.billingValue}>$9.99/month</Text>
            </View>
          </View>
        </View>

        {/* Billing History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Billing History</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {billingHistory.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyContent}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                  <Text style={styles.historyDescription}>{item.description}</Text>
                  <Text style={styles.historyInvoice}>Invoice: {item.invoiceNumber}</Text>
                </View>
                
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>${item.amount.toFixed(2)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {getStatusText(item.status)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.historyActions}>
                <TouchableOpacity
                  onPress={() => handleDownloadInvoice(item.invoiceNumber)}
                  style={styles.downloadButton}
                >
                  <Ionicons name="download-outline" size={16} color="#007AFF" />
                  <Text style={styles.downloadText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.securityCard}>
            <View style={styles.securityRow}>
              <Ionicons name="shield-checkmark" size={24} color="#28a745" />
              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>Secure Payments</Text>
                <Text style={styles.securitySubtitle}>
                  Your payment information is encrypted and secure
                </Text>
              </View>
            </View>
          </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  paymentMethodCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  cardInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cardExpiry: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  defaultBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  removeButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addPaymentText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  billingInfoCard: {
    gap: 12,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingLabel: {
    fontSize: 14,
    color: '#666',
  },
  billingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historyItem: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historyDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  historyInvoice: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyActions: {
    alignItems: 'flex-start',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  securityCard: {
    padding: 0,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  securitySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
