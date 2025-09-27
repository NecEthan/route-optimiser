import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Customer from "./customer";
import { API_CONFIG } from '@/lib';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CustomerType = {
    id: string | number;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    created_at?: string;
    updated_at?: string;
};

type CustomerListProps = {
    showEdit?: boolean;
    onEdit?: (customerId: string | number) => void;
    onCustomerPress?: (customer: CustomerType) => void;
};

type CustomerListRef = {
    refreshCustomers: () => void;
};

const CustomerList = forwardRef<CustomerListRef, CustomerListProps>(({ showEdit = true, onEdit, onCustomerPress }, ref) => {
    const [customers, setCustomers] = useState<CustomerType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const fetchCustomers = async () => {
        try {
            console.log('🔄 CustomerList: Starting fetchCustomers...');
            setLoading(true);
            setError(null);
            
            const token = await AsyncStorage.getItem('access_token');
            console.log('🔑 CustomerList: Token exists:', !!token);
            console.log('🌐 CustomerList: API URL:', API_CONFIG.BASE_URL + '/api/customers');
            
            const response = await fetch(API_CONFIG.BASE_URL + '/api/customers', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            console.log('📡 CustomerList: Response status:', response.status);
            console.log('📡 CustomerList: Response OK:', response.ok);
            
            const data = await response.json();
            console.log('📦 CustomerList: Raw response data:', data);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${data.message || 'Failed to fetch customers'}`);
            }
            
            const customers = Array.isArray(data) ? data : data.data || [];
            console.log('👥 CustomerList: Processed customers:', customers.length, 'items');
            console.log('📋 CustomerList: Customer names:', customers.map((c: CustomerType) => c.name));
            
            setCustomers(customers);
            setLoading(false);

        } catch (error: any) {
            console.error("❌ CustomerList Error details:", error.message, error.name);
            console.error("❌ CustomerList Full error:", error);
            setError(error.message);
            setCustomers([]);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useImperativeHandle(ref, () => ({
        refreshCustomers: fetchCustomers,
    }));

    const handleCustomerToggle = (customerId: string | number, isChecked: boolean) => {
        // console.log(`Customer ${customerId} ${isChecked ? 'checked' : 'unchecked'}`);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>Loading customers...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.messageContainer}>
                    <Text style={styles.errorText}>Error: {error}</Text>
                    <Text style={styles.messageText}>Please check the console for details.</Text>
                </View>
            </View>
        );
    }

    if (customers.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>No customers found.</Text>
                    <Text style={styles.subMessageText}>Add your first customer to get started!</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {customers.map((customer) => (
                <View key={customer.id} style={styles.customerWrapper}>
                    <Customer 
                        customer={customer} 
                        onToggle={(isChecked) => handleCustomerToggle(customer.id, isChecked)}
                        onEdit={onEdit}
                        {...(onCustomerPress && { onPress: () => onCustomerPress(customer) })}
                        showEdit={showEdit}
                    />
                </View>
            ))}
        </View>
    );
});

CustomerList.displayName = 'CustomerList';

export default CustomerList;

const styles = StyleSheet.create({
    container: {
    },
    customerWrapper: {
        marginBottom: 12,
    },
    messageContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    subMessageText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '600',
    },
});