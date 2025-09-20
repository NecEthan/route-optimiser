import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type JobProps = {
  job: {
    id?: string | number;
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
  onToggle?: (isChecked: boolean) => void;
  onEdit?: (jobId: string | number) => void;
  showEdit?: boolean; // Flag to show edit button instead of checkbox
};

export default function Job({ job, onToggle, onEdit, showEdit = false }: JobProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleToggle = () => {
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    onToggle?.(newCheckedState); 
  };

  const handleEdit = () => {
    onEdit?.(job.id || job.name);
  };

  return (
    <View style={styles.container}>
      {showEdit ? (
        // Edit button for customers
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <FontAwesome name="edit" size={16} color="#007AFF" />
        </TouchableOpacity>
      ) : (
        // Checkbox for jobs
        <TouchableOpacity 
          style={styles.checkbox} 
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          <View style={[styles.checkboxBox, isChecked && styles.checkboxChecked]}>
            {isChecked && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        </TouchableOpacity>
      )}
      
      <View style={styles.content}>
        <Text style={[styles.name, !showEdit && isChecked && styles.nameChecked]}>
          {job.name}
        </Text>
        <Text style={[styles.address, !showEdit && isChecked && styles.addressChecked]}>
          {job.address}
        </Text>
        {job.phone && (
          <Text style={[styles.phone, !showEdit && isChecked && styles.addressChecked]}>
            📞 {job.phone}
          </Text>
        )}
        {job.email && (
          <Text style={[styles.email, !showEdit && isChecked && styles.addressChecked]}>
            ✉️ {job.email}
          </Text>
        )}
      </View>
    </View>
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
    marginRight: 12,
    paddingTop: 2, // Align with text
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
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  nameChecked: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  addressChecked: {
    color: '#999',
    textDecorationLine: 'line-through',
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
});