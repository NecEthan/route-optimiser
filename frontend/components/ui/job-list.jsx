import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Job from "./job";
import { customerService } from '@/lib';

export default function JobList({ showEdit = false, onEdit, onJobPress }) {
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const customersData = await customerService.getAllCustomers();
            console.log('✅ Fetched customers:', customersData.length);
            setCustomers(customersData);
        } catch (error) {
            console.error("❌ Error fetching customers:", error);
            setCustomers([]); 
        }
    };

    const handleJobToggle = (customerId, isChecked) => {
        // Handle customer service completion toggle
        console.log(`Customer ${customerId} service marked as ${isChecked ? 'completed' : 'incomplete'}`);
    };

    const handleCashToggle = (customerId, isPaidInCash) => {
        // Handle cash payment toggle for customer - no API call, just local state
        console.log(`Customer ${customerId} payment updated locally: ${isPaidInCash ? 'paid in cash' : 'not paid in cash'}`);
        
        // Update local state only
        setCustomers(prevCustomers => prevCustomers.map(customer => 
            customer.id === customerId ? { ...customer, paid_in_cash: isPaidInCash } : customer
        ));
    };

    const handleJobPress = (customer) => {
        onJobPress?.(customer);
    };

    return (
        <View style={styles.container}>
            {Array.isArray(customers) && customers.map((customer) => (
                <View key={customer.id} style={styles.jobWrapper}>
                    <Job 
                        job={customer} 
                        onToggle={(isChecked) => handleJobToggle(customer.id, isChecked)}
                        onCashToggle={(isPaidInCash) => handleCashToggle(customer.id, isPaidInCash)}
                        onEdit={onEdit}
                        onPress={() => handleJobPress(customer)}
                        showEdit={showEdit}
                    />
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
    },
    jobWrapper: {
        marginBottom: 12,
    },
});