import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/lib';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
}

export default function AddExpenseModal({ visible, onClose, onExpenseAdded }: AddExpenseModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setAmount('');
    setDescription('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter an expense name.');
      return false;
    }

    if (!amount.trim()) {
      Alert.alert('Validation Error', 'Please enter an amount.');
      return false;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than 0.');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

      const expenseData = {
        category: name.trim(),
        amount: parseFloat(amount),
        notes: description.trim(),
        expense_date: new Date().toISOString(),
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/accounting/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(expenseData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert('Success', 'Expense added successfully!');
        resetForm();
        onExpenseAdded();
        onClose();
      } else {
        Alert.alert('Error', result.message || 'Failed to add expense. Please try again.');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmountInput = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = text.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Add Expense</Text>
          
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Expense Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expense Details</Text>
            
            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="pricetag-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Office Supplies, Gas, Equipment"
                  placeholderTextColor="#999"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Amount Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash-outline" size={20} color="#666" style={styles.inputIcon} />
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  value={amount}
                  onChangeText={(text) => setAmount(formatAmountInput(text))}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Description Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <Ionicons name="document-text-outline" size={20} color="#666" style={styles.textAreaIcon} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter expense details..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Amounts</Text>
            <View style={styles.quickAmountGrid}>
              {['25', '50', '100', '200'].map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    amount === quickAmount && styles.quickAmountButtonActive
                  ]}
                  onPress={() => setAmount(quickAmount)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.quickAmountText,
                    amount === quickAmount && styles.quickAmountTextActive
                  ]}>
                    ${quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button (Mobile) */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Add Expense</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '400',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textAreaIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  amountInput: {
    textAlign: 'left',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAmountButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 70,
    alignItems: 'center',
  },
  quickAmountButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  quickAmountTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
