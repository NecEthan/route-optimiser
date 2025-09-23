import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './button';

interface AddScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onScheduleCreated?: (schedule: ScheduleData) => void;
}

interface ScheduleData {
  dailyHours: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  workingDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  totalWeeklyHours: number;
  daysCount: number;
}

export default function AddScheduleModal({ visible, onClose, onScheduleCreated }: AddScheduleModalProps) {
  const [dailyHours, setDailyHours] = useState({
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
    saturday: 0,
    sunday: 0,
  });
  const [workingDays, setWorkingDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  const resetForm = () => {
    setDailyHours({
      monday: 8,
      tuesday: 8,
      wednesday: 8,
      thursday: 8,
      friday: 8,
      saturday: 0,
      sunday: 0,
    });
    setWorkingDays({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    });
  };

  const getWorkingDaysCount = () => {
    return Object.values(workingDays).filter(Boolean).length;
  };

  const getTotalWeeklyHours = () => {
    return Object.entries(workingDays)
      .filter(([day, isWorking]) => isWorking)
      .reduce((total, [day, _]) => total + dailyHours[day as keyof typeof dailyHours], 0);
  };

  const toggleWorkingDay = (day: keyof typeof workingDays) => {
    const newWorkingDays = { ...workingDays, [day]: !workingDays[day] };
    
    // If turning off a day, set its hours to 0
    // If turning on a day, set it to 8 hours default
    const newDailyHours = { ...dailyHours };
    if (!workingDays[day]) {
      // Turning on
      newDailyHours[day] = 8;
    } else {
      // Turning off
      newDailyHours[day] = 0;
    }
    
    // Ensure at least one day is selected
    const selectedDays = Object.values(newWorkingDays).filter(Boolean).length;
    if (selectedDays > 0) {
      setWorkingDays(newWorkingDays);
      setDailyHours(newDailyHours);
    }
  };

  const updateDayHours = (day: keyof typeof dailyHours, hours: number) => {
    if (hours >= 0 && hours <= 24) {
      setDailyHours(prev => ({ ...prev, [day]: hours }));
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateAndOptimize = () => {
    const daysCount = getWorkingDaysCount();
    const totalWeeklyHours = getTotalWeeklyHours();

    // Validation
    if (daysCount === 0) {
      Alert.alert('Invalid Input', 'Please select at least one working day');
      return;
    }

    // Check if any working day has invalid hours
    const invalidDays = Object.entries(workingDays)
      .filter(([day, isWorking]) => isWorking && (dailyHours[day as keyof typeof dailyHours] <= 0 || dailyHours[day as keyof typeof dailyHours] > 24))
      .map(([day, _]) => day.charAt(0).toUpperCase() + day.slice(1));

    if (invalidDays.length > 0) {
      Alert.alert('Invalid Input', `Please set valid hours (1-24) for: ${invalidDays.join(', ')}`);
      return;
    }

    const scheduleData: ScheduleData = {
      dailyHours,
      workingDays,
      totalWeeklyHours,
      daysCount,
    };

    // Provide feedback with vibration
    Vibration.vibrate([100, 50, 100]);

    // Get selected days list with hours
    const selectedDaysWithHours = Object.entries(workingDays)
      .filter(([_, selected]) => selected)
      .map(([day, _]) => `${day.charAt(0).toUpperCase() + day.slice(1)} (${dailyHours[day as keyof typeof dailyHours]}h)`)
      .join(', ');

    // Show optimization results
    Alert.alert(
      'Schedule Optimized!',
      `Your weekly schedule:\n\n` +
      `${selectedDaysWithHours}\n\n` +
      `• ${daysCount} working days\n` +
      `• ${totalWeeklyHours} total weekly hours\n\n` +
      `This schedule provides flexible daily hours while maximizing productivity.\n\n` +
      `Note: Ready for AI optimization once database table is created.`,
      [
        {
          text: 'Create Schedule',
          onPress: () => {
            // Just pass the data back to parent component
            // Database saving will be implemented after table creation
            console.log('📅 Schedule data prepared for AI optimizer:', scheduleData);
            console.log(`  - Daily hours:`, scheduleData.dailyHours);
            console.log(`  - Working days: ${Object.entries(scheduleData.workingDays).filter(([_, selected]) => selected).map(([day, _]) => day).join(', ')}`);
            console.log(`  - Total weekly hours: ${scheduleData.totalWeeklyHours}`);
            onScheduleCreated?.(scheduleData);
            handleClose();
          }
        },
        {
          text: 'Adjust',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Schedule</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.description}>
            Set hours for each working day
          </Text>

          {/* Working Days with Individual Hours - Compact Grid */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Schedule</Text>
            <View style={styles.compactDaysGrid}>
              {Object.entries(workingDays).map(([day, isWorking]) => (
                <View key={day} style={styles.compactDayRow}>
                  <TouchableOpacity
                    style={[styles.compactDayToggle, isWorking && styles.compactDayToggleActive]}
                    onPress={() => toggleWorkingDay(day as keyof typeof workingDays)}
                  >
                    <Text style={[styles.compactDayText, isWorking && styles.compactDayTextActive]}>
                      {day.slice(0, 3).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                  
                  {isWorking ? (
                    <View style={styles.compactHoursInput}>
                      <TouchableOpacity 
                        style={styles.compactAdjustButton} 
                        onPress={() => updateDayHours(day as keyof typeof dailyHours, dailyHours[day as keyof typeof dailyHours] - 0.5)}
                      >
                        <Ionicons name="remove" size={12} color="#007AFF" />
                      </TouchableOpacity>
                      
                      <Text style={styles.compactHoursText}>
                        {dailyHours[day as keyof typeof dailyHours]}h
                      </Text>
                      
                      <TouchableOpacity 
                        style={styles.compactAdjustButton} 
                        onPress={() => updateDayHours(day as keyof typeof dailyHours, dailyHours[day as keyof typeof dailyHours] + 0.5)}
                      >
                        <Ionicons name="add" size={12} color="#007AFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.compactRestText}>OFF</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Compact Preview and Button */}
          <View style={styles.bottomSection}>
            <View style={styles.compactPreview}>
              <Text style={styles.compactPreviewTitle}>
                {getTotalWeeklyHours()}h total • {getWorkingDaysCount()} days
              </Text>
            </View>
            
            <Button
              title="⚡ Optimize Schedule"
              onPress={validateAndOptimize}
              variant="primary"
              size="large"
            />
          </View>
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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  compactDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  compactDayRow: {
    width: '48%',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  compactDayToggle: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  compactDayToggleActive: {
    backgroundColor: '#007AFF',
  },
  compactDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
  },
  compactDayTextActive: {
    color: '#fff',
  },
  compactHoursInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactAdjustButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactHoursText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 32,
    textAlign: 'center',
  },
  compactRestText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  bottomSection: {
    marginTop: 'auto',
  },
  compactPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  compactPreviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
});
