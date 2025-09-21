import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type CustomerProps = {
  customer: {
    id?: string | number;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    created_at?: string;
    updated_at?: string;
  };
  onToggle?: (isChecked: boolean) => void;
  onEdit?: (jobId: string | number) => void;
  onPress?: (customer: any) => void;
  showEdit?: boolean; 
};

export default function Customer({ customer, onToggle, onEdit, onPress, showEdit = false }: CustomerProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleToggle = () => {
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    onToggle?.(newCheckedState); 
  };

  const handleEdit = () => {
    onEdit?.(customer.id || customer.name);
  };

  const handlePress = () => {
    onPress?.(customer);
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={showEdit ? handlePress : undefined}
      activeOpacity={showEdit ? 0.7 : 1}
    >
      <View style={styles.content}>
        <Text style={[styles.name, !showEdit && isChecked && styles.nameChecked]}>
          {customer.name}
        </Text>
        <Text style={[styles.address, !showEdit && isChecked && styles.addressChecked]}>
          {customer.address}
        </Text>
        {customer.phone && (
          <Text style={[styles.phone, !showEdit && isChecked && styles.addressChecked]}>
            📞 {customer.phone}
          </Text>
        )}
        {customer.email && (
          <Text style={[styles.email, !showEdit && isChecked && styles.addressChecked]}>
            ✉️ {customer.email}
          </Text>
        )}
      </View>
      
      {showEdit && (
        <View>
          <FontAwesome name="chevron-right" size={14} color="#999" />
        </View>
      )}
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
    alignItems: 'center',
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
    paddingTop: 2,
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