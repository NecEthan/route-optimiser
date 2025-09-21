import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type JobProps = {
  job: {
    id: string; // uuid from database
    customer_id?: string; // uuid foreign key
    user_id?: string; // uuid foreign key
    description: string; // text not null
    price: number; // numeric(10, 2) not null
    frequency?: string; // character varying(50), default 'monthly'
    last_completed?: string; // date
    estimated_duration?: number; // integer (minutes)
    active?: boolean; // boolean, default true
    paid_in_cash?: boolean; // boolean, default false
    created_at?: string; // timestamp with time zone
    updated_at?: string; // timestamp with time zone
    customers?: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      address: string;
    };
    title?: string;
    service_type?: string;
    completed?: boolean;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  onToggle?: (isChecked: boolean) => void;
  onCashToggle?: (jobId: string, isPaidInCash: boolean) => void;
  onEdit?: (jobId: string) => void;
  onPress?: () => void;
  showEdit?: boolean;
};

export default function Job({ job, onToggle, onCashToggle, onEdit, onPress, showEdit = false }: JobProps) {
  // Only track cash payment status
  const [isPaidInCash, setIsPaidInCash] = useState(job.paid_in_cash || false);

  const handleCashToggle = () => {
    const newCashState = !isPaidInCash;
    setIsPaidInCash(newCashState);
    if (job.id) {
      onCashToggle?.(job.id, newCashState);
    }
  };

  const handleEdit = () => {
    if (job.id) {
      onEdit?.(job.id);
    }
  };

  const handlePress = () => {
    onPress?.();
  };

  const displayTitle = job.title || job.description || 'Untitled Job';
  const displayAddress = job.customers?.address || job.address || 'No address';
  const displayPhone = job.customers?.phone || job.phone;
  const displayEmail = job.customers?.email || job.email;
  const customerName = job.customers?.name;
  const jobPrice = job.price;
  const jobFrequency = job.frequency;
  const estimatedDuration = job.estimated_duration;
  const lastCompleted = job.last_completed;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      {showEdit ? (
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <FontAwesome name="edit" size={16} color="#007AFF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.checkboxContainer}>
          <TouchableOpacity 
            style={[styles.checkbox, styles.cashCheckbox]} 
            onPress={handleCashToggle}
            activeOpacity={0.7}
          >
            <View style={[styles.checkboxBox, styles.cashCheckboxBox, isPaidInCash && styles.cashCheckboxChecked]}>
              {isPaidInCash && (
                <FontAwesome name="dollar" size={10} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.name}>
          {displayTitle}
        </Text>
        {customerName && (
          <Text style={styles.customerName}>
            👤 {customerName}
          </Text>
        )}
        <Text style={styles.address}>
          📍 {displayAddress}
        </Text>
        {jobPrice && (
          <Text style={styles.price}>
            💰 ${jobPrice}
          </Text>
        )}
        {jobFrequency && (
          <Text style={styles.frequency}>
            🔄 {jobFrequency}
          </Text>
        )}
        {estimatedDuration && (
          <Text style={styles.duration}>
            ⏱️ {estimatedDuration} min
          </Text>
        )}
        {lastCompleted && (
          <Text style={styles.lastCompleted}>
            ✅ Last: {new Date(lastCompleted).toLocaleDateString()}
          </Text>
        )}
        {displayPhone && (
          <Text style={styles.phone}>
            📞 {displayPhone}
          </Text>
        )}
        {displayEmail && (
          <Text style={styles.email}>
            ✉️ {displayEmail}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkbox: {
    paddingTop: 2,
  },
  checkboxContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 2,
  },
  cashCheckbox: {
    marginTop: 0,
    marginRight: 0,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashCheckboxBox: {
    borderColor: '#4CAF50',
  },
  cashCheckboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  editButton: {
    marginRight: 12,
    paddingTop: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  serviceType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  frequency: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  duration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lastCompleted: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 2,
    fontWeight: '500',
  },
});
