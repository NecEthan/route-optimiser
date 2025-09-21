import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import Customer from "./customer";
import { API_CONFIG } from '@/lib';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CustomerType = {
    id: string | number;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    frequency?: string;
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
    
    const fetchCustomers = async () => {
        try {
            console.log('🔄 Starting to fetch customers...');
            console.log('📍 API URL:', API_CONFIG.BASE_URL + '/api/customers');
            
            const token = await AsyncStorage.getItem('access_token');
            console.log('🔑 Token exists:', !!token);
            
            const response = await fetch(API_CONFIG.BASE_URL + '/api/customers', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);
            
            const data = await response.json();
            console.log("✅ Got customers data:", data);
            console.log("📊 Data type:", typeof data, Array.isArray(data));
            
            const customers = Array.isArray(data) ? data : data.data || [];
            console.log("👥 Final customers array:", customers.length, "customers");
            setCustomers(customers);

        } catch (error: any) {
            console.error("❌ Error fetching customers:", error);
            console.error("❌ Error details:", error.message, error.name);
            setCustomers([]);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // Expose refresh method to parent component
    useImperativeHandle(ref, () => ({
        refreshCustomers: fetchCustomers,
    }));

    const handleCustomerToggle = (customerId: string | number, isChecked: boolean) => {
        console.log(`Customer ${customerId} ${isChecked ? 'checked' : 'unchecked'}`);
    };

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
});