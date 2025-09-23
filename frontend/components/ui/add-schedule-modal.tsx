import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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
  hoursPerDay: number;
  daysPerWeek: number;
  totalWeeklyHours: number;
}

export default function AddScheduleModal({ visible, onClose, onScheduleCreated }: AddScheduleModalProps) {
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [daysPerWeek, setDaysPerWeek] = useState('5');

  const resetForm = () => {
    setHoursPerDay('8');
    setDaysPerWeek('5');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateAndOptimize = () => {
    const hours = parseFloat(hoursPerDay);
    const days = parseInt(daysPerWeek);

    // Validation
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      Alert.alert('Invalid Input', 'Hours per day must be between 1 and 24');
      return;
    }

    if (isNaN(days) || days <= 0 || days > 7) {
      Alert.alert('Invalid Input', 'Days per week must be between 1 and 7');
      return;
    }

    const totalWeeklyHours = hours * days;
    const scheduleData: ScheduleData = {
      hoursPerDay: hours,
      daysPerWeek: days,
      totalWeeklyHours,
    };

    // Provide feedback with vibration
    Vibration.vibrate([100, 50, 100]);

    // Show optimization results
    Alert.alert(
      'Schedule Optimized!',
      `Your weekly schedule:\n\n` +
      `• ${hours} hours per day\n` +
      `• ${days} days per week\n` +
      `• ${totalWeeklyHours} total weekly hours\n\n` +
      `This schedule provides a good work-life balance while maximizing productivity.`,
      [
        {
          text: 'Create Schedule',
          onPress: () => {
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

  const incrementHours = () => {
    const current = parseFloat(hoursPerDay) || 0;
    if (current < 24) {
      setHoursPerDay((current + 0.5).toString());
    }
  };

  const decrementHours = () => {
    const current = parseFloat(hoursPerDay) || 0;
    if (current > 0.5) {
      setHoursPerDay((current - 0.5).toString());
    }
  };

  const incrementDays = () => {
    const current = parseInt(daysPerWeek) || 0;
    if (current < 7) {
      setDaysPerWeek((current + 1).toString());
    }
  };

  const decrementDays = () => {
    const current = parseInt(daysPerWeek) || 0;
    if (current > 1) {
      setDaysPerWeek((current - 1).toString());
    }
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
            Set your ideal work schedule to optimize your window cleaning route
          </Text>

          {/* Hours per Day */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hours per Day</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity 
                style={styles.adjustButton} 
                onPress={decrementHours}
              >
                <Ionicons name="remove" size={20} color="#007AFF" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                value={hoursPerDay}
                onChangeText={setHoursPerDay}
                keyboardType="decimal-pad"
                placeholder="8"
                textAlign="center"
              />
              
              <TouchableOpacity 
                style={styles.adjustButton} 
                onPress={incrementHours}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Between 1 and 24 hours</Text>
          </View>

          {/* Days per Week */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Days per Week</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity 
                style={styles.adjustButton} 
                onPress={decrementDays}
              >
                <Ionicons name="remove" size={20} color="#007AFF" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                value={daysPerWeek}
                onChangeText={setDaysPerWeek}
                keyboardType="number-pad"
                placeholder="5"
                textAlign="center"
              />
              
              <TouchableOpacity 
                style={styles.adjustButton} 
                onPress={incrementDays}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Between 1 and 7 days</Text>
          </View>

          {/* Preview */}
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Weekly Summary</Text>
            <Text style={styles.previewText}>
              {parseFloat(hoursPerDay || '0') * parseInt(daysPerWeek || '0')} total hours per week
            </Text>
          </View>

          {/* Optimize Button */}
          <View style={styles.buttonContainer}>
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
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  adjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  input: {
    width: 80,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  preview: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    paddingTop: 20,
  },
});
