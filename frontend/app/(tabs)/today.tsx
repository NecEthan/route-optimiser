import React, { useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, Alert, ScrollView } from "react-native";
import JobList from "@/components/ui/job-list";
import JobDetailsModal from "@/components/ui/job-details-modal";
import AddJobModal from "@/components/ui/add-job-modal";
import Button from "@/components/ui/button";
import { Customer } from "@/lib/customer-service";

export default function TodayScreen() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [jobListKey, setJobListKey] = useState(0); // Force re-render of job list
  const [cashPaymentStates, setCashPaymentStates] = useState<{[key: string]: boolean}>({}); // Track cash payment status for each customer

  const handleRefresh = () => {
    Alert.alert("Refresh", "Refreshing customer list...");
  };

  const handleAddJob = () => {
    setShowAddJobModal(true);
  };

  const handleCustomerAdded = () => {
    console.log('✅ Customer added successfully, refreshing customer list');
    setJobListKey(prev => prev + 1); // Force refresh of job list
  };

  const handleCloseAddJobModal = () => {
    setShowAddJobModal(false);
  };

  const handleOptimiseRoute = () => {
    Alert.alert("Optimise Route", "Optimising route for today's customers...");
  };

  const handleCustomerPress = (customer: Customer) => {
    console.log('🎯 Customer pressed in today screen:', customer.name);
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const handleCashPaymentChange = (customerId: string, isPaidInCash: boolean) => {
    // Update cash payment state when checkbox is clicked
    setCashPaymentStates(prev => ({
      ...prev,
      [customerId]: isPaidInCash
    }));
    console.log(`💰 Cash payment status updated for customer ${customerId}: ${isPaidInCash}`);
  };

  const handleEditCustomer = (customer: Customer) => {
    console.log('✏️ Edit customer requested:', customer.name);
    setShowCustomerDetails(false);
    Alert.alert(
      'Edit Customer',
      `Edit functionality for "${customer.name}" will be implemented soon.`
    );
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    setSelectedCustomer(updatedCustomer);
  };

  const handleCustomerCompleted = (customerId: string) => {
    console.log(`✅ Customer ${customerId} completed and removed from today's list`);
    console.log('🔄 Forcing JobList refresh...');
    
    // Remove from cash payment states as well
    setCashPaymentStates(prev => {
      const updated = { ...prev };
      delete updated[customerId];
      return updated;
    });
    
    // Force refresh the JobList to show updated data
    setJobListKey(prev => prev + 1);
  };

  const handleCloseCustomerDetails = () => {
    setShowCustomerDetails(false);
    setSelectedCustomer(null);
    
    // Always refresh the customer list when modal closes
    // This ensures any completed customers are filtered out
    console.log('🔄 Modal closed - refreshing customer list...');
    setJobListKey(prev => prev + 1); // Force JobList to re-render and fetch fresh data
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={[styles.h1, styles.heading]}>Today</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Add New Customer" 
            onPress={handleAddJob}
            variant="outline"
            size="medium"
          />
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <JobList 
          key={jobListKey} // Force re-render when key changes
          showEdit={false} 
          onEdit={() => {}} 
          onJobPress={handleCustomerPress}
          onCashPaymentChange={handleCashPaymentChange}
          onCustomerCompleted={handleCustomerCompleted}
        />
        
        
      </ScrollView>

      {/* Customer Details Modal */}
      <JobDetailsModal
        visible={showCustomerDetails}
        job={selectedCustomer}
        onClose={handleCloseCustomerDetails}
        onEdit={handleEditCustomer}
        onJobUpdated={handleCustomerUpdated}
        onCustomerCompleted={handleCustomerCompleted}
        cashPaymentStatus={selectedCustomer ? cashPaymentStates[selectedCustomer.id] || false : false}
      />

      {/* Add Customer Modal */}
      <AddJobModal
        visible={showAddJobModal}
        onClose={handleCloseAddJobModal}
        onCustomerAdded={handleCustomerAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
});