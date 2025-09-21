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
import Button from './button';
import { jobService } from '@/lib';

export interface Job {
  id?: string | number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  service_frequency?: string;
  notes?: string;
  completed?: boolean;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface JobDetailsModalProps {
  visible: boolean;
  job: Job | null;
  onClose: () => void;
  onEdit?: (job: Job) => void;
  onJobUpdated?: (updatedJob: Job) => void; // New callback for when job is updated
}

export default function JobDetailsModal({
  visible,
  job,
  onClose,
  onEdit,
  onJobUpdated,
}: JobDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    service_frequency: '',
    notes: '',
  });

  // Update form data when job changes or modal opens
  useEffect(() => {
    if (job) {
      setEditFormData({
        name: job.name || '',
        address: job.address || '',
        phone: job.phone || '',
        email: job.email || '',
        service_frequency: job.service_frequency || '',
        notes: job.notes || '',
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
      
      // TODO: Call API to update job
      // For now, just show success and exit edit mode
      Alert.alert(
        'Success!',
        `Job "${editFormData.name}" has been updated.`,
        [{ text: 'OK' }]
      );

      // Update the job in parent component if callback provided
      if (onJobUpdated) {
        const updatedJob = { ...job, ...editFormData };
        onJobUpdated(updatedJob);
      }

      setIsEditing(false);

    } catch (error) {
      console.error('❌ Failed to save job:', error);
      Alert.alert(
        'Error',
        'Failed to save changes. Please try again.',
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
        name: job.name || '',
        address: job.address || '',
        phone: job.phone || '',
        email: job.email || '',
        service_frequency: job.service_frequency || '',
        notes: job.notes || '',
      });
    }
    setIsEditing(false);
  };

  const handleMarkComplete = async () => {
    if (!job?.id) {
      Alert.alert('Error', 'Job ID is missing');
      return;
    }

    if (job.completed) {
      // Job is already completed, ask if they want to mark as incomplete
      Alert.alert(
        'Job Already Complete',
        'This job is already marked as complete. Would you like to mark it as incomplete?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Incomplete',
            style: 'destructive',
            onPress: () => handleMarkIncomplete(),
          },
        ]
      );
      return;
    }

    // Show completion confirmation with notes option
    Alert.prompt(
      'Mark Job Complete',
      'Are you sure you want to mark this job as complete? You can add optional notes below.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Complete',
          onPress: (notes: string | undefined) => performJobCompletion(notes),
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const performJobCompletion = async (notes?: string) => {
    if (!job?.id) return;

    setIsUpdating(true);
    try {
      console.log('🎯 Marking job as complete:', job.id, notes);
      
      const updatedJob = await jobService.markJobComplete(job.id, notes);
      
      Alert.alert(
        'Success!',
        `Job "${job.name}" has been marked as complete.`,
        [{ text: 'OK' }]
      );

      // Update the job in parent component if callback provided
      if (onJobUpdated) {
        onJobUpdated(updatedJob);
      }

      // Close the modal after successful completion
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('❌ Failed to mark job complete:', error);
      Alert.alert(
        'Error',
        'Failed to mark job as complete. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkIncomplete = async () => {
    if (!job?.id) return;

    setIsUpdating(true);
    try {
      console.log('🔄 Marking job as incomplete:', job.id);
      
      const updatedJob = await jobService.markJobIncomplete(job.id);
      
      Alert.alert(
        'Success!',
        `Job "${job.name}" has been marked as incomplete.`,
        [{ text: 'OK' }]
      );

      // Update the job in parent component if callback provided
      if (onJobUpdated) {
        onJobUpdated(updatedJob);
      }

    } catch (error) {
      console.error('❌ Failed to mark job incomplete:', error);
      Alert.alert(
        'Error',
        'Failed to mark job as incomplete. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
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
          {/* Customer Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            
            {renderField(
              "person", 
              "Customer Name", 
              job.name, 
              "name", 
              "Enter customer name"
            )}

            {renderField(
              "location", 
              "Address", 
              job.address, 
              "address", 
              "Enter address"
            )}

            {(job.phone || isEditing) && renderField(
              "call", 
              "Phone", 
              job.phone || '', 
              "phone", 
              "Enter phone number"
            )}

            {(job.email || isEditing) && renderField(
              "mail", 
              "Email", 
              job.email || '', 
              "email", 
              "Enter email address"
            )}
          </View>

          {/* Service Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Information</Text>

            {(job.service_frequency || isEditing) && renderField(
              "calendar", 
              "Service Frequency", 
              job.service_frequency ? 
                job.service_frequency.charAt(0).toUpperCase() + job.service_frequency.slice(1) : '', 
              "service_frequency", 
              "Enter service frequency"
            )}

            {(job.notes || isEditing) && renderField(
              "document-text", 
              "Notes", 
              job.notes || '', 
              "notes", 
              "Enter notes or special instructions",
              true
            )}
          </View>

          {/* Completion Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completion Status</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={job.completed ? "checkmark-circle" : "time"} 
                  size={20} 
                  color={job.completed ? "#2E7D32" : "#FF9800"} 
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.label}>Status</Text>
                <View style={[
                  styles.statusBadge, 
                  job.completed ? styles.completedBadge : styles.pendingBadge
                ]}>
                  <Text style={[
                    styles.statusText,
                    job.completed ? styles.completedText : styles.pendingText
                  ]}>
                    {job.completed ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>

            {job.completed && job.completed_at && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.label}>Completed At</Text>
                  <Text style={styles.value}>{formatDate(job.completed_at)}</Text>
                </View>
              </View>
            )}
          </View>

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
              title={job.completed ? "Mark as Incomplete" : "Mark as Complete"}
              onPress={handleMarkComplete}
              variant={job.completed ? "outline" : "primary"}
              size="large"
              style={Object.assign({}, styles.footerButton, { opacity: isUpdating ? 0.6 : 1 })}
              disabled={isUpdating}
            />
          )}
        </View>
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
});
