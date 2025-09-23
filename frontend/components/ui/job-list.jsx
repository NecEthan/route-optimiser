import React, { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Job from "./job";
import { customerService } from '@/lib';

const JobList = forwardRef(({ showEdit = false, onEdit, onJobPress, onCashPaymentChange, onCustomerCompleted, selectedDate }, ref) => {
    const [customers, setCustomers] = useState([]);

    const fetchCustomers = useCallback(async () => {
        try {
            console.log('🔄 Fetching customers...');
            const customersData = await customerService.getAllCustomers();
            console.log('✅ Fetched customers:', customersData.length);
            
            // Filter out customers completed on the selected date
            const filterDate = selectedDate || new Date().toISOString().split('T')[0]; // Default to today if no date provided
            console.log('📅 Filter date for customers:', filterDate);
            
            console.log('🔍 All customers data:');
            customersData.forEach((customer, index) => {
                console.log(`  ${index + 1}. ${customer.name}: last_completed = "${customer.last_completed}" (${typeof customer.last_completed})`);
            });
            
            const activeCustomers = customersData.filter((customer, index) => {
                const isCompletedOnSelectedDate = customer.last_completed === filterDate;
                console.log(`🔍 Customer ${index + 1} (${customer.name}): last_completed="${customer.last_completed}" vs selected="${filterDate}" → ${isCompletedOnSelectedDate ? '❌ FILTERED OUT' : '✅ INCLUDED'}`);
                return !isCompletedOnSelectedDate; // Only show if NOT completed on selected date
            });
            console.log(`✅ Active customers for ${filterDate}: ${activeCustomers.length} (filtered from ${customersData.length} total)`);
            
            setCustomers(activeCustomers);
        } catch (error) {
            console.error("❌ Error fetching customers:", error);
            setCustomers([]); 
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleJobToggle = (customerId, isChecked) => {
        // Handle customer service completion toggle
        console.log(`Customer ${customerId} service marked as ${isChecked ? 'completed' : 'incomplete'}`);
    };

    const handleCashToggle = async (customerId, isPaidInCash) => {
        console.log('🔍 handleCashToggle called with:---------------------', isPaidInCash);
        
        try {
            console.log(isPaidInCash, '_____-----____');
            const paymentMethod = isPaidInCash ? 'cash' : 'card';
            const paymentStatus = isPaidInCash;
            
            await customerService.patchCustomer(customerId, { 
                payment_method: paymentMethod,
                payment_status: paymentStatus
            });
            
            setCustomers(prevCustomers => prevCustomers.map(customer => 
                customer.id === customerId ? { 
                    ...customer, 
                    paid_in_cash: isPaidInCash,
                    payment_method: paymentMethod,
                    payment_status: paymentStatus
                } : customer
            ));
            
            // Notify parent component about cash payment change
            if (onCashPaymentChange) {
                onCashPaymentChange(customerId, isPaidInCash);
            }
        } catch (error) {
            console.error(`❌ Error updating customer ${customerId} payment_method:`, error);
            alert('Failed to update payment method. Please try again.');
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
                        onCashToggle={(customerId, isPaidInCash) => handleCashToggle(customer.id, isPaidInCash)}
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