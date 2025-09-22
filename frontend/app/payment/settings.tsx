import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Button from "@/components/ui/button";
import { Ionicons } from '@expo/vector-icons';
import { settingsService } from '@/lib';

interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_payment_method_id: string;
  last_four: string;
  card_type: string;
  expiration_month: number;
  expiration_year: number;
  bank_name?: string | null;
  subscription_price: number;
  subscription_start_date: string;
  billing_cycle: string;
  subscription_type: string;
  status: string;
  created_at: string;
  updated_at: string;
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

useEffect(() => {
  
  fetchSubscription();
}, []);

const fetchSubscription = async () => {
    try {
      const response = await settingsService.getUserSubscription();
      console.log('User subscription data:', response);
      
      if (response.success && response.data) {
        // Convert the single subscription to the payment methods array format
        setPaymentMethods([response.data]);
      } else {
        // No subscription found, use empty array
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      // Keep mock data on error for now
    }
  };
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      user_id: 'mock-user-id',
      stripe_customer_id: 'cus_mock_001',
      stripe_subscription_id: 'sub_mock_001',
      stripe_payment_method_id: 'pm_mock_001',
      last_four: '4242',
      card_type: 'visa',
      expiration_month: 12,
      expiration_year: 2025,
      bank_name: null,
      subscription_price: 9.99,
      subscription_start_date: '2025-01-01',
      billing_cycle: 'monthly',
      subscription_type: 'basic',
      status: 'active',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: '2',
      user_id: 'mock-user-id',
      stripe_customer_id: 'cus_mock_002',
      stripe_subscription_id: 'sub_mock_002', 
      stripe_payment_method_id: 'pm_mock_002',
      last_four: '5555',
      card_type: 'mastercard',
      expiration_month: 8,
      expiration_year: 2026,
      bank_name: null,
      subscription_price: 9.99,
      subscription_start_date: '2025-02-01',
      billing_cycle: 'monthly',
      subscription_type: 'basic',
      status: 'active',
      created_at: '2025-02-01T00:00:00Z',
      updated_at: '2025-02-01T00:00:00Z'
    }
  ]);  const [billingHistory] = useState<BillingHistoryItem[]>([
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

  const getCardIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
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

  const getCardName = (cardType: string) => {
    switch (cardType.toLowerCase()) {
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
    Alert.alert('Update Card', `This would open an update form for card ending in ${paymentMethods.find(p => p.id === cardId)?.last_four}`);
  };

  const handleSetDefaultCard = async (cardId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For subscription model, there's typically only one active subscription
      // But we can still mark it as the primary one
      
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
    
    Alert.alert(
      'Cancel Subscription',
      `Are you sure you want to cancel your subscription with card ending in ${card?.last_four}? This will end your subscription.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: () => {
            // In real app, this would cancel the Stripe subscription
            setPaymentMethods(prev => prev.filter(method => method.id !== cardId));
            Alert.alert('Success', 'Subscription cancelled.');
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
                  <Ionicons name="card" size={24} color="#007AFF" />
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardType}>{getCardName(method.card_type)}</Text>
                    <Text style={styles.cardNumber}>•••• •••• •••• {method.last_four}</Text>
                    <Text style={styles.cardExpiry}>
                      Expires {method.expiration_month.toString().padStart(2, '0')}/{method.expiration_year}
                    </Text>
                  </View>
                </View>
                {method.status === 'active' && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Active</Text>
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
                
                <Button
                  title="Update Billing"
                  onPress={() => handleSetDefaultCard(method.id)}
                  variant="outline"
                  size="small"
                  loading={loading}
                  disabled={loading}
                />
                
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
            {paymentMethods.length > 0 && (
              <>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Subscription:</Text>
                  <Text style={styles.billingValue}>{paymentMethods[0].subscription_type.charAt(0).toUpperCase() + paymentMethods[0].subscription_type.slice(1)} Plan</Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Billing cycle:</Text>
                  <Text style={styles.billingValue}>{paymentMethods[0].billing_cycle.charAt(0).toUpperCase() + paymentMethods[0].billing_cycle.slice(1)}</Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Amount:</Text>
                  <Text style={styles.billingValue}>${paymentMethods[0].subscription_price}/{paymentMethods[0].billing_cycle}</Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Started:</Text>
                  <Text style={styles.billingValue}>{formatDate(paymentMethods[0].subscription_start_date)}</Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Status:</Text>
                  <Text style={[styles.billingValue, { color: paymentMethods[0].status === 'active' ? '#28a745' : '#dc3545' }]}>
                    {paymentMethods[0].status.charAt(0).toUpperCase() + paymentMethods[0].status.slice(1)}
                  </Text>
                </View>
              </>
            )}
            {paymentMethods.length === 0 && (
              <View style={styles.billingRow}>
                <Text style={styles.billingLabel}>No active subscription</Text>
                <Text style={styles.billingValue}>-</Text>
              </View>
            )}
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
