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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from './button';
import { customerService, API_CONFIG, Customer } from '@/lib';
import { accountingService } from '@/lib/accounting-service';

interface CustomerDetailsModalProps {
  visible: boolean;
  job: Customer | null; // Still called 'job' for backward compatibility with existing code
  onClose: () => void;
  onEdit?: (customer: Customer) => void;
  onJobUpdated?: (updatedCustomer: Customer) => void; // Callback for when customer is updated
  onCustomerCompleted?: (customerId: string) => void; // Callback for when customer is completed
  cashPaymentStatus?: boolean; // Track if cash checkbox was checked
}

export default function JobDetailsModal({
  visible,
  job,
  onClose,
  onEdit,
  onJobUpdated,
  onCustomerCompleted,
  cashPaymentStatus = false,
}: CustomerDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const [editFormData, setEditFormData] = useState({
    description: '',
    price: '',
    frequency: '',
    estimated_duration: '',
  });

  // Update form data when job changes or modal opens
  useEffect(() => {
    if (job) {
      setEditFormData({
        description: job.description || '',
        price: job.price?.toString() || '',
        frequency: job.frequency || 'monthly',
        estimated_duration: job.estimated_duration?.toString() || '',
      });
    }
  }, [job]);

  // Early return if no job
  if (!job) return null;

  // Helper function to render editable or display field
  const renderField = (
    iconName: string,
    label: string, 
    value: string,
    fieldKey: keyof typeof editFormData,
    placeholder?: string,
    multiline?: boolean
  ) => (
    <View style={styles.infoRow}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName as any} size={20} color="#007AFF" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.label}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={[styles.editInput, multiline && styles.multilineInput]}
            value={editFormData[fieldKey]}
            onChangeText={(text) => 
              setEditFormData(prev => ({ ...prev, [fieldKey]: text }))
            }
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
          />
        ) : (
          <Text style={styles.value}>{value}</Text>
        )}
      </View>
    </View>
  );

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = () => {
    if (isEditing) {
      // Save changes
      handleSaveChanges();
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!job?.id) return;

    setIsUpdating(true);
    try {
      console.log('💾 Saving job changes:', editFormData);
      
      // Get auth headers
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Convert form data to proper types
      const updateData = {
        id: job.id,
        customer_id: job.id,
        user_id: job.user_id,
        description: editFormData.description,
        price: parseFloat(editFormData.price) || 0,
        frequency: editFormData.frequency,
        last_completed: job.last_completed,
        estimated_duration: editFormData.estimated_duration ? parseInt(editFormData.estimated_duration) : null,
        active: job.status !== undefined ? job.status : true,
        created_at: job.created_at,
        updated_at: new Date().toISOString()
      };

      // Call the PUT /api/jobs/:id endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Job updated successfully:', data);
      
      Alert.alert(
        'Success!',
        `Job "${editFormData.description}" has been updated.`,
        [{ text: 'OK' }]
      );

      // Update the job in parent component if callback provided
      if (onJobUpdated && data.success && data.job) {
        onJobUpdated(data.job);
      }

      setIsEditing(false);

    } catch (error) {
      console.error('❌ Failed to save job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Error',
        `Failed to save changes: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original values
    if (job) {
      setEditFormData({
        description: job.description || '',
        price: job.price?.toString() || '',
        frequency: job.frequency || 'monthly',
        estimated_duration: job.estimated_duration?.toString() || '',
      });
    }
    setIsEditing(false);
  };

  const handleMarkComplete = async () => {
    if (!job?.id) {
      Alert.alert('Error', 'Job ID is missing');
      return;
    }

    setShowCompletionPrompt(true);
  };

  const handleCompletionConfirm = () => {
    setShowCompletionPrompt(false);
    performJobCompletion();
  };

  const handleCompletionCancel = () => {
    setShowCompletionPrompt(false);
  };

  const performJobCompletion = async () => {
    console.log('🚀 Starting job completion for customer:', job?.id);
    if (!job?.id) return;

    setIsUpdating(true);
    try {
      console.log('📝 Calling markServiceComplete...');
      const updatedCustomer = await customerService.markServiceComplete(job.id);
      console.log('✅ Customer service marked as complete:', updatedCustomer);
      console.log('📅 Updated customer last_completed:', updatedCustomer.last_completed);
      
      // Create payment record
      console.log('💰 Creating payment record...');
      await accountingService.addPayment({
        customer_id: job.id, // Use customer's own ID since we're now customer-centric
        amount: job.price,
        method: cashPaymentStatus ? 'cash' : 'pending', // Set method based on checkbox
        notes: `Payment for: ${job.description || job.name}`
      });
      console.log(`✅ Payment created with status: ${cashPaymentStatus ? 'paid' : 'pending'}`);
      
      // Update parent component
      if (onJobUpdated) {
        console.log('🔄 Calling onJobUpdated with updated customer...');
        onJobUpdated(updatedCustomer);
      }
      console.log('(((((((((99999')
      // Notify parent that customer is completed and should be removed from list
      if (onCustomerCompleted) {
        console.log(`📢 Modal calling onCustomerCompleted for customer ${job.id}`);
        onCustomerCompleted(job.id);
      } else {
        console.log('❌ Modal: onCustomerCompleted callback not provided');
      }

    } catch (error) {
      console.error('❌ Failed to mark customer service complete:', error);
      // Continue and close modal even if completion failed
    } finally {
      setIsUpdating(false);
      // Always close modal regardless of success or failure
      console.log('🚪 Closing modal...');
      onClose();
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={isEditing ? handleCancelEdit : onClose} style={styles.headerButton}>
            <Ionicons name={isEditing ? "close" : "close"} size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEditing ? 'Edit Job' : 'Job Details'}</Text>
          <TouchableOpacity 
            onPress={handleEdit} 
            style={isEditing ? styles.saveHeaderButton : styles.editHeaderButton}
            disabled={isUpdating}
          >
            {isEditing ? (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.editButtonText}>Save</Text>
              </>
            ) : (
              <>
                <Ionicons name="pencil" size={18} color="#fff" />
                <Text style={styles.editButtonText}>Edit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Job Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Information</Text>
            
            {renderField(
              "document-text", 
              "Description", 
              job.description, 
              "description", 
              "Enter job description",
              true
            )}

            {renderField(
              "cash", 
              "Price", 
              `$${job.price}`, 
              "price", 
              "Enter price"
            )}

            {renderField(
              "calendar", 
              "Frequency", 
              job.frequency || 'monthly', 
              "frequency", 
              "Enter frequency (weekly, monthly, etc.)"
            )}

            {(job.estimated_duration || isEditing) && renderField(
              "time", 
              "Estimated Duration (minutes)", 
              job.estimated_duration?.toString() || '', 
              "estimated_duration", 
              "Enter duration in minutes"
            )}

            {/* Active Status */}
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={job.status ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={job.status ? "#2E7D32" : "#F44336"} 
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.label}>Active Status</Text>
                <View style={[
                  styles.statusBadge, 
                  job.status ? styles.activeBadge : styles.inactiveBadge
                ]}>
                  <Text style={[
                    styles.statusText,
                    job.status ? styles.activeText : styles.inactiveText
                  ]}>
                    {job.status ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Customer Information */}
          {job.customers && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="person" size={20} color="#007AFF" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.label}>Customer Name</Text>
                  <Text style={styles.value}>{job.customers.name}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="location" size={20} color="#007AFF" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.label}>Address</Text>
                  <Text style={styles.value}>{job.customers.address}</Text>
                </View>
              </View>

              {job.customers.phone && (
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="call" size={20} color="#007AFF" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.label}>Phone</Text>
                    <Text style={styles.value}>{job.customers.phone}</Text>
                  </View>
                </View>
              )}

              {job.customers.email && (
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="mail" size={20} color="#007AFF" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{job.customers.email}</Text>
                  </View>
                </View>
              )}
            </View>
          )}


          {/* Timeline Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="add-circle" size={20} color="#007AFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.label}>Created</Text>
                <Text style={styles.value}>{formatDate(job.created_at)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="refresh" size={20} color="#007AFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.label}>Last Updated</Text>
                <Text style={styles.value}>{formatDate(job.updated_at)}</Text>
              </View>
            </View>
          </View>

          {/* Debug Information */}
          {job.id && (
            <View style={styles.debugSection}>
              <Text style={styles.debugText}>Job ID: {job.id}</Text>
              {job.user_id && <Text style={styles.debugText}>User ID: {job.user_id}</Text>}
            </View>
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          {isEditing ? (
            <Button
              title="Cancel"
              onPress={handleCancelEdit}
              variant="outline"
              size="large"
              style={styles.footerButton}
            />
          ) : (
            <Button
              title={"Mark as Complete"}
              onPress={handleMarkComplete}
              variant={"primary"}
              size="large"
              style={Object.assign({}, styles.footerButton, { opacity: isUpdating ? 0.6 : 1 })}
              disabled={isUpdating}
            />
          )}
        </View>
      </View>
    </Modal>

    {/* Completion Prompt Modal */}
    <Modal
      visible={showCompletionPrompt}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCompletionCancel}
    >
      <View style={styles.promptOverlay}>
        <View style={styles.promptContainer}>
          {/* Header with Icon */}
          <View style={styles.promptHeader}>
            <View style={styles.promptIconContainer}>
              <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
            </View>
            <Text style={styles.promptTitle}>Complete Job</Text>
            <Text style={styles.promptSubtitle}>
              {job?.customers?.name ? `${job.customers.name} • ` : ''}{job?.price ? `$${job.price}` : ''}
            </Text>
          </View>

          {/* Job Description */}
          <View style={styles.promptJobInfo}>
            <Text style={styles.promptJobDescription}>&ldquo;{job?.description}&rdquo;</Text>
            {job?.customers?.address && (
              <Text style={styles.promptJobAddress}>📍 {job.customers.address}</Text>
            )}
          </View>

          {/* Confirmation Message */}
          <Text style={styles.promptMessage}>
            Are you sure you want to mark this job as complete?
          </Text>

          {/* Action Buttons */}
          <View style={styles.promptButtons}>
            <TouchableOpacity
              style={[styles.promptButton, styles.promptCancelButton]}
              onPress={handleCompletionCancel}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color="#666" />
              <Text style={styles.promptCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.promptButton, styles.promptConfirmButton]}
              onPress={handleCompletionConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.promptConfirmText}>Complete Job</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
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
  editHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  saveHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editInput: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginTop: 4,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
    lineHeight: 22,
  },
  contactText: {
    color: '#007AFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  completedBadge: {
    backgroundColor: '#E8F5E8',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedText: {
    color: '#2E7D32',
  },
  pendingText: {
    color: '#F57C00',
  },
  activeBadge: {
    backgroundColor: '#E8F5E8',
  },
  inactiveBadge: {
    backgroundColor: '#FFEBEE',
  },
  activeText: {
    color: '#2E7D32',
  },
  inactiveText: {
    color: '#F44336',
  },
  debugSection: {
    backgroundColor: '#f9f9f9',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 8,
    padding: 12,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  footerButton: {
    marginBottom: 0,
  },
  // Prompt modal styles
  promptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  promptContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  promptHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  promptIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  promptSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    textAlign: 'center',
  },
  promptJobInfo: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  promptJobDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  promptJobAddress: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  promptMessage: {
    fontSize: 15,
    color: '#666',
    paddingHorizontal: 24,
    paddingBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  promptButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  promptButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  promptCancelButton: {
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  promptConfirmButton: {
    backgroundColor: 'transparent',
  },
  promptCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  promptConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
});
