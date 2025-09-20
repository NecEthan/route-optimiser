import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import Customer from "./customer";
import { API_CONFIG } from '@/lib';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomerList = forwardRef(({ showEdit = true, onEdit }, ref) => {
    const [customers, setCustomers] = useState([]);

    const fetchCustomers = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            
            const response = await fetch(API_CONFIG.BASE_URL + '/api/customers', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            console.log("Got customers:", data);
            
            const customers = Array.isArray(data) ? data : data.data || [];
            setCustomers(customers);

        } catch (error) {
            console.error("Error fetching customers:", error);
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

    const handleCustomerToggle = (customerId, isChecked) => {
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