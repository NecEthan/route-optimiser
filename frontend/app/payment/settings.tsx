import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, SafeAreaView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Button from "@/components/ui/button";
import { Ionicons } from '@expo/vector-icons';
import { authService, settingsService } from '@/lib';

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
  fetchSubscription();
}, []);

const fetchPaymentMethod = async () => {
    try {
      const user = await authService.getUser();
      const response = await settingsService.getUserPaymentMethod(user.id);
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

const fetchSubscription = async () => {
    try {
      const response = await settingsService.getUserSubscription();
      console.log('User subscription data:', response);
      
      if (response.success && response.data) {
        setSubscription(response.data);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      setSubscription(null);
    }
  };
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscription, setSubscription] = useState<any>(null); 

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
    console.log('🚀 === HANDLE CARD SUBMIT CALLED ===');
    console.log('🔍 cardToReplace:', cardToReplace);
    console.log('📱 Platform:', Platform.OS);
    console.log('🎯 CardField available:', CardField !== null);
    console.log('⚡ Stripe available:', !!stripe?.createPaymentMethod);
    
    // Validate inputs
    if (!newCard.cardholderName.trim()) {
      console.log('❌ Validation failed: Missing cardholder name');
      Alert.alert('Error', 'Please enter cardholder name');
      return;
    }
    
    console.log('📝 newCard state:', newCard);
    console.log('🃏 CardField value:', CardField);

    // Check if using Stripe CardField or legacy form
    const isUsingStripeCardField = CardField !== null && newCard.cardComplete;
    const isUsingLegacyForm = CardField === null && newCard.cardNumber && newCard.expiryMonth && newCard.expiryYear && newCard.cvc;
    
    console.log('🔍 Validation check:', {
      isUsingStripeCardField,
      isUsingLegacyForm,
      cardComplete: newCard.cardComplete,
      hasCardNumber: !!newCard.cardNumber,
      hasExpiryMonth: !!newCard.expiryMonth,
      hasExpiryYear: !!newCard.expiryYear,
      hasCvc: !!newCard.cvc
    });
    
    if (!isUsingStripeCardField && !isUsingLegacyForm) {
      console.log('❌ Validation failed: Card details incomplete');
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

        // Handle card replacement or addition
        if (cardToReplace) {
          console.log('🔄 Updating existing payment method with ID:', cardToReplace);
          
          // Prepare update data according to database schema
          const updateData = {
            stripe_payment_method_id: paymentMethod.id,
            last_four: (paymentMethod as any).Card?.last4 || 'xxxx',
            card_type: (paymentMethod as any).Card?.brand || 'unknown',
            expiration_month: (paymentMethod as any).Card?.expMonth || 0,
            expiration_year: (paymentMethod as any).Card?.expYear || 0,
            cardholder_name: newCard.cardholderName,
            bank_name: (paymentMethod as any).Card?.issuer || null,
            status: 'active'
          };

          console.log('📦 Sending update data:', updateData);

          try {
            const result = await settingsService.updatePaymentMethod(cardToReplace, updateData);
            
            if (result.success) {
              console.log('✅ Payment method updated successfully!');
              Alert.alert('Success', 'Payment method updated successfully!');
              
              // Refresh the payment method data
              await fetchPaymentMethod();
            } else {
              console.error('❌ Update failed:', result.message);
              Alert.alert('Error', result.message || 'Failed to update payment method');
              return;
            }
          } catch (updateError) {
            console.error('💥 Update error:', updateError);
            const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
            Alert.alert('Error', `Failed to update payment method: ${errorMessage}`);
            return;
          }
        } else {
          console.log('➕ Would add new payment method (not implemented yet)');
          Alert.alert('Info', 'Add new payment method functionality not implemented yet');
        }

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
        // FALLBACK PATH - For testing or when Stripe is not available
        console.log('⚠️ Using fallback path (Stripe not available)');
        console.log('🔍 CardField available:', CardField !== null);
        console.log('🔍 Stripe available:', !!stripe?.createPaymentMethod);
        
        if (cardToReplace) {
          console.log('🔄 [FALLBACK] Updating existing payment method with ID:', cardToReplace);
          
          // Mock payment method data for testing
          const mockUpdateData = {
            stripe_payment_method_id: `pm_test_${Date.now()}`,
            last_four: newCard.cardNumber ? newCard.cardNumber.slice(-4) : '4242',
            card_type: 'visa',
            expiration_month: parseInt(newCard.expiryMonth) || 12,
            expiration_year: parseInt(newCard.expiryYear) || 2028,
            cardholder_name: newCard.cardholderName,
            bank_name: 'Test Bank',
            status: 'active'
          };

          console.log('📦 [FALLBACK] Sending update data:', mockUpdateData);

          try {
            const result = await settingsService.updatePaymentMethod(cardToReplace, mockUpdateData);
            
            if (result.success) {
              console.log('✅ [FALLBACK] Payment method updated successfully!');
              Alert.alert('Success', 'Payment method updated successfully!');
              
              // Refresh the payment method data
              await fetchPaymentMethod();
            } else {
              console.error('❌ [FALLBACK] Update failed:', result.message);
              Alert.alert('Error', result.message || 'Failed to update payment method');
              return;
            }
          } catch (updateError) {
            console.error('💥 [FALLBACK] Update error:', updateError);
            const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
            Alert.alert('Error', `Failed to update payment method: ${errorMessage}`);
            return;
          }
        } else {
          console.log('➕ [FALLBACK] Would add new payment method (not implemented yet)');
          Alert.alert('Info', 'Add new payment method functionality not implemented yet');
        }

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

  const handleCreateTestData = async () => {
    try {
      setLoading(true);
      const result = await settingsService.createTestData();
      
      if (result.success) {
        Alert.alert('Success', 'Test data created! Refreshing page...');
        // Refresh the data
        await fetchPaymentMethod();
        await fetchSubscription();
      } else {
        Alert.alert('Error', result.message || 'Failed to create test data');
      }
    } catch (error) {
      console.error('Error creating test data:', error);
      Alert.alert('Error', 'Failed to create test data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
          </View>
          
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
            {subscription ? (
              <>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Plan:</Text>
                  <Text style={styles.billingValue}>{subscription.subscription_type || 'Basic Plan'}</Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Billing Cycle:</Text>
                  <Text style={styles.billingValue}>
                    {subscription.billing_cycle === 'monthly' ? 'Monthly' : 
                     subscription.billing_cycle === 'yearly' ? 'Yearly' : 
                     subscription.billing_cycle || 'Monthly'}
                  </Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Amount:</Text>
                  <Text style={[styles.billingValue, { fontWeight: '700', fontSize: 16 }]}>
                    {subscription.formatted_price || `£${parseFloat(subscription.subscription_price || 0).toFixed(2)}`}
                    <Text style={{ fontSize: 12, color: '#666', fontWeight: '400' }}>
                      /{subscription.billing_cycle === 'yearly' ? 'year' : 'month'}
                    </Text>
                  </Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Next Billing:</Text>
                  <Text style={styles.billingValue}>
                    {subscription.next_billing_date 
                      ? formatDate(subscription.next_billing_date) 
                      : 'Calculating...'
                    }
                  </Text>
                </View>
                <View style={styles.billingRow}>
                  <Text style={styles.billingLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: subscription.status === 'active' ? '#28a745' : '#dc3545' }
                  ]}>
                    <Text style={[styles.statusText, { color: 'white' }]}>
                      {subscription.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'Unknown'}
                    </Text>
                  </View>
                </View>
              </>
            ) : loading ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.billingLabel}>Loading subscription details...</Text>
              </View>
            ) : (
              <View style={styles.emptyStateCard}>
                <Ionicons name="receipt-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No Active Subscription</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Subscribe to a plan to access premium features
                </Text>
              </View>
            )}
          </View>
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

        {/* Development/Test Section - Remove in production */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development Tools</Text>
            <View style={styles.testSection}>
              <Text style={styles.testSectionSubtitle}>
                Create sample subscription and payment method data for testing
              </Text>
              <Button
                title={loading ? "Creating..." : "Create Test Data"}
                onPress={handleCreateTestData}
                variant="secondary"
                disabled={loading}
                style={{ marginTop: 12 }}
              />
            </View>
          </View>
        )}
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
  

  // Empty state styles (for billing info only)
  emptyStateCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Test section styles
  testSection: {
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b8daff',
  },
  testSectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
});
