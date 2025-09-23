import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, SafeAreaView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Button from "@/components/ui/button";
import { Ionicons } from '@expo/vector-icons';
import { settingsService } from '@/lib';

// Import Stripe components using platform-specific resolution
import { CardField, useStripe } from '@/lib/stripe-native';

interface PaymentMethod {
  id: string; // UUID from the database
  user_id: string;
  stripe_customer_id: string;
  stripe_payment_method_id: string;
  last_four: string | null;
  card_type: string | null;
  expiration_month: number | null;
  expiration_year: number | null;
  bank_name?: string | null;
  cardholder_name: string | null;
  is_default: boolean;
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
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [cardToReplace, setCardToReplace] = useState<string | null>(null);
  
  // Always call useStripe hook first
  const stripeRaw = useStripe();
  
  // Then modify based on platform
  const stripe = Platform.OS === 'web' 
    ? { createPaymentMethod: null } 
    : (stripeRaw || { createPaymentMethod: null });
  
  const [newCard, setNewCard] = useState({
    cardholderName: '',
    cardComplete: false,
    cardDetails: null as any, // Will hold Stripe card details
    // Keep legacy fields for web fallback
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
  });

useEffect(() => {
  
  fetchPaymentMethod();
}, []);

const fetchPaymentMethod = async () => {
    try {
      const response = await settingsService.getUserPaymentMethod();
      console.log('User payment method data:', response);
      
      if (response.success && response.data) {
        // Set the single payment method
        setPaymentMethods([response.data]);
      } else {
        // No payment method found, use empty array
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('Error fetching user payment method:', error);
      // Set empty array on error
      setPaymentMethods([]);
    }
  };
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);  const [billingHistory] = useState<BillingHistoryItem[]>([
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

  const getCardName = (cardType: string | null | undefined) => {
    if (!cardType) return 'Credit Card';
    
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

  // Helper functions for card input formatting
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryMonth = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned.slice(0, 2);
  };

  const formatExpiryYear = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned.slice(0, 4);
  };

  const formatCVC = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned.slice(0, 4);
  };

  const handleCardSubmit = async () => {
    // Validate inputs
    if (!newCard.cardholderName.trim()) {
      Alert.alert('Error', 'Please enter cardholder name');
      return;
    }

    // Check if using Stripe CardField or legacy form
    const isUsingStripeCardField = CardField !== null && newCard.cardComplete;
    const isUsingLegacyForm = CardField === null && newCard.cardNumber && newCard.expiryMonth && newCard.expiryYear && newCard.cvc;
    
    if (!isUsingStripeCardField && !isUsingLegacyForm) {
      Alert.alert('Error', 'Please enter complete card details');
      return;
    }

    setLoading(true);
    try {
      if (CardField !== null && stripe?.createPaymentMethod) {
        // REAL STRIPE VALIDATION - Mobile/Native
        console.log('🔐 Creating payment method with Stripe CardField...');
        
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          paymentMethodType: 'Card',
          paymentMethodData: {
            billingDetails: {
              name: newCard.cardholderName,
            },
          },
        });

        if (error) {
          console.error('❌ Stripe validation failed:', error);
          
          // Handle validation errors with generic message
          let userFriendlyMessage = 'Please check your card details and try again.';
          
          if (error.message?.includes('number')) {
            userFriendlyMessage = 'Please enter a valid card number.';
          } else if (error.message?.includes('expiry') || error.message?.includes('month') || error.message?.includes('year')) {
            userFriendlyMessage = 'Please enter a valid expiry date.';
          } else if (error.message?.includes('cvc') || error.message?.includes('CVC')) {
            userFriendlyMessage = 'Please enter a valid CVC code.';
          } else if (error.message?.includes('expired')) {
            userFriendlyMessage = 'This card has expired. Please use a different card.';
          } else if (error.message?.includes('declined')) {
            userFriendlyMessage = 'Your card was declined. Please try a different card.';
          }
          
          Alert.alert('Card Validation Failed', userFriendlyMessage);
          return;
        }

        if (!paymentMethod) {
          console.error('❌ No payment method returned');
          Alert.alert('Error', 'Failed to validate card details');
          return;
        }

        console.log('✅ Stripe validated payment method:', paymentMethod.id);
        console.log('💳 Card details:', {
          brand: (paymentMethod as any).Card?.brand || 'unknown',
          last4: (paymentMethod as any).Card?.last4 || 'xxxx',
          exp_month: (paymentMethod as any).Card?.expMonth || 0,
          exp_year: (paymentMethod as any).Card?.expYear || 0,
        });

        // Send validated token to backend
        const result = await settingsService.addPaymentMethodWithToken({
          paymentMethodId: paymentMethod.id, // Real validated Stripe token
          cardholderName: newCard.cardholderName,
          replaceCardId: cardToReplace,
        });

        if (result.success) {
          if (cardToReplace) {
            // Replace existing card
            setPaymentMethods(prev => 
              prev.map(method => 
                method.id === cardToReplace 
                  ? { 
                      ...result.data, 
                      is_default: method.is_default
                    } 
                  : method
              )
            );
            Alert.alert('Success', 'Payment method replaced successfully!');
          } else {
            // Add new card
            const newPaymentMethod = { ...result.data };
            setPaymentMethods(prev => [...prev, newPaymentMethod]);
            Alert.alert('Success', 'Payment method added successfully!');
          }

          // Reset form and close modal
          setNewCard({
            cardholderName: '',
            cardComplete: false,
            cardDetails: null,
            cardNumber: '',
            expiryMonth: '',
            expiryYear: '',
            cvc: '',
          });
          setCardToReplace(null);
          setShowAddCardModal(false);
        } else {
          Alert.alert('Error', result.message || 'Failed to save payment method');
        }

      } else {
        // LEGACY FORM VALIDATION - Web fallback (still uses mock data for demo)
        console.log('⚠️ Using legacy form validation (web fallback)');
        
        // Basic validation for legacy form
        const cardNumberClean = newCard.cardNumber.replace(/\s/g, '');
        if (cardNumberClean.length !== 16) {
          Alert.alert('Error', 'Please enter a valid 16-digit card number');
          return;
        }

        // Simulate API call for demo purposes
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create mock payment method object for demo
        const mockPaymentMethod = {
          id: `pm_new_${Date.now()}`,
          user_id: 'current-user-id',
          stripe_customer_id: 'cus_demo_customer',
          stripe_payment_method_id: `pm_demo_${Date.now()}`,
          last_four: cardNumberClean.slice(-4),
          card_type: getCardTypeFromNumber(cardNumberClean),
          expiration_month: parseInt(newCard.expiryMonth),
          expiration_year: parseInt(newCard.expiryYear),
          bank_name: null,
          cardholder_name: newCard.cardholderName,
          is_default: paymentMethods.length === 0,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (cardToReplace) {
          // Replace existing card with mock data
          setPaymentMethods(prev => 
            prev.map(method => 
              method.id === cardToReplace 
                ? { ...mockPaymentMethod, is_default: method.is_default }
                : method
            )
          );
          Alert.alert('Success', 'Payment method replaced successfully! (Demo Mode)');
        } else {
          // Add new card with mock data
          setPaymentMethods(prev => [...prev, mockPaymentMethod]);
          Alert.alert('Success', 'Payment method added successfully! (Demo Mode)');
        }

        // Reset form and close modal
        setNewCard({
          cardholderName: '',
          cardComplete: false,
          cardDetails: null,
          cardNumber: '',
          expiryMonth: '',
          expiryYear: '',
          cvc: '',
        });
        setCardToReplace(null);
        setShowAddCardModal(false);
      }

    } catch (err) {
      console.error('❌ Payment method creation failed:', err);
      Alert.alert('Error', 'Failed to process payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCardTypeFromNumber = (cardNumber: string): string => {
    if (cardNumber.startsWith('4')) return 'visa';
    if (cardNumber.startsWith('5') || cardNumber.startsWith('2')) return 'mastercard';
    if (cardNumber.startsWith('3')) return 'amex';
    if (cardNumber.startsWith('6')) return 'discover';
    return 'unknown';
  };

  const handleReplaceCard = (cardId: string) => {
    // Set the card to be replaced and open modal directly
    setCardToReplace(cardId);
    setShowAddCardModal(true);
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
                    <Text style={styles.cardNumber}>•••• •••• •••• {method.last_four || 'XXXX'}</Text>
                    <Text style={styles.cardExpiry}>
                      Expires {method.expiration_month && method.expiration_year 
                        ? `${method.expiration_month.toString().padStart(2, '0')}/${method.expiration_year}`
                        : 'N/A'
                      }
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
                  title="Replace Card"
                  onPress={() => handleReplaceCard(paymentMethods[0].id)}
                  variant="secondary"
                  size="small"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Billing Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Information</Text>
          <View style={styles.billingInfoCard}>
            {paymentMethods.length > 0 && (
              <>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Subscription:</Text>
                                    <Text style={styles.billingValue}>Basic Plan</Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Billing Frequency</Text>
                  <Text style={styles.billingValue}>Monthly</Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Amount</Text>
                  <Text style={styles.billingValue}>$29.99/month</Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Next Billing Date</Text>
                  <Text style={styles.billingValue}>{formatDate(new Date().toISOString())}</Text>
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

      {/* Add Payment Method Modal */}
      <Modal
        visible={showAddCardModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddCardModal(false);
          setCardToReplace(null);
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setShowAddCardModal(false);
                  setCardToReplace(null);
                }}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {cardToReplace ? 'Replace Payment Method' : 'Add Payment Method'}
              </Text>
              <TouchableOpacity 
                onPress={handleCardSubmit}
                style={[styles.modalSaveButton, loading && styles.modalSaveButtonDisabled]}
                disabled={loading}
              >
                <Text style={[styles.modalSaveText, loading && styles.modalSaveTextDisabled]}>
                  {loading ? 'Adding...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Card Preview */}
              <View style={styles.cardPreviewContainer}>
                <View style={styles.cardPreview}>
                  <View style={styles.cardPreviewTop}>
                    <Text style={styles.cardPreviewBank}>
                      {newCard.cardDetails?.brand?.toUpperCase() || 
                       getCardTypeFromNumber(newCard.cardNumber.replace(/\s/g, ''))?.toUpperCase() || 'CARD'}
                    </Text>
                    <View style={styles.cardPreviewChip} />
                  </View>
                  
                  <View style={styles.cardPreviewMiddle}>
                    <Text style={styles.cardPreviewNumber}>
                      {newCard.cardDetails?.last4 ? `•••• •••• •••• ${newCard.cardDetails.last4}` :
                       newCard.cardNumber || '•••• •••• •••• ••••'}
                    </Text>
                  </View>
                  
                  <View style={styles.cardPreviewBottom}>
                    <View>
                      <Text style={styles.cardPreviewLabel}>CARD HOLDER</Text>
                      <Text style={styles.cardPreviewName}>
                        {newCard.cardholderName.toUpperCase() || 'YOUR NAME'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.cardPreviewLabel}>EXPIRES</Text>
                      <Text style={styles.cardPreviewExpiry}>
                        {newCard.cardDetails?.expiryMonth && newCard.cardDetails?.expiryYear 
                          ? `${newCard.cardDetails.expiryMonth.toString().padStart(2, '0')}/${newCard.cardDetails.expiryYear.toString().slice(-2)}`
                          : newCard.expiryMonth && newCard.expiryYear 
                          ? `${newCard.expiryMonth.padStart(2, '0')}/${newCard.expiryYear.slice(-2)}`
                          : 'MM/YY'
                        }
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Form Fields */}
              <View style={styles.modalFormSection}>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>Card Information</Text>
                  {CardField ? (
                    <CardField
                      postalCodeEnabled={false}
                      placeholders={{
                        number: '4242 4242 4242 4242',
                      }}
                      cardStyle={{
                        backgroundColor: '#FFFFFF',
                        textColor: '#000000',
                        borderColor: '#ddd',
                        borderWidth: 1,
                        borderRadius: 8,
                      }}
                      style={styles.cardField}
                      onCardChange={(details: any) => {
                        console.log('💳 Card details changed:', details);
                        setNewCard(prev => ({
                          ...prev,
                          cardComplete: details.complete || false,
                          cardDetails: details,
                        }));
                      }}
                    />
                  ) : (
                    <View style={styles.stripeUnavailable}>
                      <Text style={styles.stripeUnavailableText}>
                        Secure card input not available on web. Using legacy form for demo.
                      </Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Card Number (Test: 4242 4242 4242 4242)"
                        value={newCard.cardNumber}
                        onChangeText={(text) => setNewCard(prev => ({ 
                          ...prev, 
                          cardNumber: formatCardNumber(text),
                        }))}
                        keyboardType="numeric"
                        maxLength={19}
                      />
                      
                      <View style={styles.modalRowInputs}>
                        <View style={[styles.modalInputGroup, { flex: 1, marginRight: 10 }]}>
                          <Text style={styles.modalInputLabel}>MM</Text>
                          <TextInput
                            style={styles.modalInput}
                            placeholder="12"
                            value={newCard.expiryMonth}
                            onChangeText={(text) => setNewCard(prev => ({ ...prev, expiryMonth: formatExpiryMonth(text) }))}
                            keyboardType="numeric"
                            maxLength={2}
                          />
                        </View>
                        
                        <View style={[styles.modalInputGroup, { flex: 1, marginRight: 10 }]}>
                          <Text style={styles.modalInputLabel}>YYYY</Text>
                          <TextInput
                            style={styles.modalInput}
                            placeholder="2027"
                            value={newCard.expiryYear}
                            onChangeText={(text) => setNewCard(prev => ({ ...prev, expiryYear: formatExpiryYear(text) }))}
                            keyboardType="numeric"
                            maxLength={4}
                          />
                        </View>
                        
                        <View style={[styles.modalInputGroup, { flex: 1 }]}>
                          <Text style={styles.modalInputLabel}>CVC</Text>
                          <TextInput
                            style={styles.modalInput}
                            placeholder="123"
                            value={newCard.cvc}
                            onChangeText={(text) => setNewCard(prev => ({ ...prev, cvc: formatCVC(text) }))}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>Cardholder Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="John Doe"
                    value={newCard.cardholderName}
                    onChangeText={(text) => setNewCard(prev => ({ ...prev, cardholderName: text.toUpperCase() }))}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.modalSecuritySection}>
                <View style={styles.modalSecurityIcon}>
                  <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.modalSecurityText}>
                  Your payment information is encrypted and secure. This is a demo form for testing purposes.
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancelButton: {
    padding: 8,
  },
  modalCancelText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSaveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveTextDisabled: {
    color: '#E0E0E0',
  },
  modalContent: {
    flex: 1,
  },
  modalFormSection: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalRowInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  modalSecuritySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E8',
    margin: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 8,
  },
  modalSecurityIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  modalSecurityText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  
  // Card Preview Styles
  cardPreviewContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  cardPreview: {
    width: '100%',
    maxWidth: 340,
    height: 200,
    backgroundColor: '#1e3a8a',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  cardPreviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardPreviewBank: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 1,
  },
  cardPreviewChip: {
    width: 32,
    height: 24,
    backgroundColor: '#60a5fa',
    borderRadius: 4,
  },
  cardPreviewMiddle: {
    marginBottom: 30,
  },
  cardPreviewNumber: {
    fontSize: 20,
    fontWeight: '400',
    color: '#fff',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardPreviewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardPreviewLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#e0e7ff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardPreviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 1,
  },
  cardPreviewExpiry: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  
  // Stripe CardField styles
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 10,
  },
  stripeUnavailable: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  stripeUnavailableText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginBottom: 10,
  },
});
