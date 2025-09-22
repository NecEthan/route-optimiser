import React, { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Job from "./job";
import { customerService } from '@/lib';

const JobList = forwardRef(({ showEdit = false, onEdit, onJobPress, onCashPaymentChange, onCustomerCompleted }, ref) => {
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            console.log('🔄 Fetching customers...');
            const customersData = await customerService.getAllCustomers();
            console.log('✅ Fetched customers:', customersData.length);
            
            // Filter out customers completed today
            const today = new Date().toISOString().split('T')[0]; // "2025-09-22"
            console.log('📅 Today date for filtering:', today);
            
            console.log('🔍 All customers data:');
            customersData.forEach((customer, index) => {
                console.log(`  ${index + 1}. ${customer.name}: last_completed = "${customer.last_completed}" (${typeof customer.last_completed})`);
            });
            
            const activeCustomers = customersData.filter((customer, index) => {
                const isCompletedToday = customer.last_completed === today;
                console.log(`🔍 Customer ${index + 1} (${customer.name}): last_completed="${customer.last_completed}" vs today="${today}" → ${isCompletedToday ? '❌ FILTERED OUT' : '✅ INCLUDED'}`);
                return !isCompletedToday; // Only show if NOT completed today
            });
            console.log(`✅ Active customers for today: ${activeCustomers.length} (filtered from ${customersData.length} total)`);
            
            setCustomers(activeCustomers);
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
        
        // Update local state
        setCustomers(prevCustomers => prevCustomers.map(customer => 
            customer.id === customerId ? { ...customer, paid_in_cash: isPaidInCash } : customer
        ));
        
        // Notify parent component about cash payment change
        if (onCashPaymentChange) {
            onCashPaymentChange(customerId, isPaidInCash);
        }
    };

    const handleJobPress = (customer) => {
        onJobPress?.(customer);
    };

    // Remove completed customer from list
    const removeCompletedCustomer = useCallback((customerId) => {
        console.log(`🗑️ DIRECT REMOVAL: Removing customer ${customerId} from JobList local state`);
        console.log(`📊 Current customers count: ${customers.length}`);
        
        setCustomers(prevCustomers => {
            const filteredCustomers = prevCustomers.filter(customer => customer.id !== customerId);
            console.log(`📊 After removal customers count: ${filteredCustomers.length}`);
            return filteredCustomers;
        });
        
        // Notify parent component
        if (onCustomerCompleted) {
            console.log('📢 Notifying parent component of customer completion');
            onCustomerCompleted(customerId);
        }
    }, [customers.length, onCustomerCompleted]);

    // Expose the removal function so parent can call it directly
    useImperativeHandle(ref, () => ({
        removeCustomer: removeCompletedCustomer
    }), [removeCompletedCustomer]);

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
                        onCompleted={() => removeCompletedCustomer(customer.id)}
                        showEdit={showEdit}
                    />
                </View>
            ))}
        </View>
    );
});

JobList.displayName = 'JobList';

export default JobList;

const styles = StyleSheet.create({
    container: {
    },
    jobWrapper: {
        marginBottom: 12,
    },
});