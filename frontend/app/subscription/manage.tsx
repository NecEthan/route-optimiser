import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Button from "@/components/ui/button";
import { Ionicons } from '@expo/vector-icons';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billing: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
}

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>({
    id: 'basic',
    name: 'Basic Plan',
    price: 9.99,
    billing: 'monthly',
    features: [
      'Up to 50 customers',
      'Basic route optimization', 
      'Mobile app access',
      'Email support'
    ],
    isActive: true
  });

  const availablePlans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 9.99,
      billing: 'monthly',
      features: [
        'Up to 50 customers',
        'Basic route optimization',
        'Mobile app access',
        'Email support'
      ],
      isActive: true
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 19.99,
      billing: 'monthly',
      features: [
        'Up to 200 customers',
        'Advanced route optimization',
        'Real-time tracking',
        'Priority support',
        'Analytics dashboard',
        'Custom scheduling'
      ],
      isActive: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 39.99,
      billing: 'monthly',
      features: [
        'Unlimited customers',
        'AI-powered optimization',
        'Multi-user access',
        '24/7 phone support',
        'Advanced analytics',
        'API access',
        'White-label options'
      ],
      isActive: false
    }
  ];

  const handleUpgradePlan = () => {
    Alert.alert(
      'Upgrade Plan',
      'Choose your new plan:',
      [
        {
          text: 'Pro Plan ($19.99/month)',
          onPress: () => upgradeToPlan('pro'),
        },
        {
          text: 'Enterprise Plan ($39.99/month)',
          onPress: () => upgradeToPlan('enterprise'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const upgradeToPlan = async (planId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newPlan = availablePlans.find(plan => plan.id === planId);
      if (newPlan) {
        setCurrentPlan({...newPlan, isActive: true});
        Alert.alert('Success', `Successfully upgraded to ${newPlan.name}!`);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      Alert.alert('Error', 'Failed to upgrade plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing cycle.',
      [
        {
          text: 'Keep Subscription',
          style: 'cancel',
        },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: cancelSubscription,
        },
      ]
    );
  };

  const cancelSubscription = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Subscription Cancelled',
        'Your subscription has been cancelled. You will continue to have access until the end of your current billing cycle.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          }
        ]
      );
    } catch (error) {
      console.error('Cancel error:', error);
      Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, billing: string) => {
    return `$${price.toFixed(2)}/${billing === 'monthly' ? 'month' : 'year'}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Subscription</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Plan Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Plan</Text>
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{currentPlan.name}</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            </View>
            <Text style={styles.planPrice}>{formatPrice(currentPlan.price, currentPlan.billing)}</Text>
            <Text style={styles.planBilling}>Billed {currentPlan.billing}</Text>
            
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Features included:</Text>
              {currentPlan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Billing Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Information</Text>
          <View style={styles.billingCard}>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Next billing date:</Text>
              <Text style={styles.billingValue}>Dec 20, 2025</Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Payment method:</Text>
              <Text style={styles.billingValue}>•••• •••• •••• 4242</Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Amount:</Text>
              <Text style={styles.billingValue}>{formatPrice(currentPlan.price, currentPlan.billing)}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Processing...' : 'Upgrade Plan'}
              onPress={handleUpgradePlan}
              variant="primary"
              size="large"
              disabled={loading}
            />
            
            <Button
              title={loading ? 'Processing...' : 'Cancel Subscription'}
              onPress={handleCancelSubscription}
              variant="danger"
              size="large"
              disabled={loading}
            />
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <View style={styles.helpContainer}>
            <TouchableOpacity style={styles.helpRow}>
              <Ionicons name="help-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.helpText}>Contact Support</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.helpRow}>
              <Ionicons name="document-text-outline" size={20} color="#007AFF" />
              <Text style={styles.helpText}>View Billing History</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </TouchableOpacity>
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  activeBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  planBilling: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  featuresContainer: {
    gap: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
  },
  billingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  buttonContainer: {
    gap: 15,
  },
  helpContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});
