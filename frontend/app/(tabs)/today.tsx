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
  const [hasCustomerUpdates, setHasCustomerUpdates] = useState(false); // Track if we need to refresh

  const handleRefresh = () => {
    Alert.alert("Refresh", "Refreshing customer list...");
  };

  const handleAddJob = () => {
    setShowAddJobModal(true);
  };

  const handleJobAdded = () => {
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

  const handleEditCustomer = (customer: Customer) => {
    console.log('✏️ Edit customer requested:', customer.name);
    setShowCustomerDetails(false);
    Alert.alert(
      'Edit Customer',
      `Edit functionality for "${customer.name}" will be implemented soon.`
    );
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    console.log('🔄 Customer updated:', updatedCustomer.name, 'Last completed:', updatedCustomer.last_completed);
    
    // Update the selected customer with the new data from server
    setSelectedCustomer(updatedCustomer);
    
    // Mark that we have customer updates that need to be reflected in the list
    setHasCustomerUpdates(true);
    
    console.log('✅ Selected customer state updated with server response');
  };

  const handleCloseCustomerDetails = () => {
    setShowCustomerDetails(false);
    setSelectedCustomer(null);
    
    // If there were customer updates, refresh the customer list
    if (hasCustomerUpdates) {
      console.log('🔄 Refreshing customer list due to updates...');
      setJobListKey(prev => prev + 1); // Force JobList to re-render and fetch fresh data
      setHasCustomerUpdates(false); // Reset the flag
    }
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
        />
        
        
      </ScrollView>

      {/* Customer Details Modal */}
      <JobDetailsModal
        visible={showCustomerDetails}
        job={selectedCustomer}
        onClose={handleCloseCustomerDetails}
        onEdit={handleEditCustomer}
        onJobUpdated={handleCustomerUpdated}
      />

      {/* Add Customer Modal */}
      <AddJobModal
        visible={showAddJobModal}
        onClose={handleCloseAddJobModal}
        onJobAdded={handleJobAdded}
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