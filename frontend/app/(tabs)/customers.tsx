import React, { useState, useRef } from "react";
import { SafeAreaView, View, StyleSheet, Text, ScrollView, Alert } from "react-native";
import Button from "@/components/ui/button";
import CustomerList from "@/components/ui/customer-list";
import AddJobModal from "@/components/ui/add-job-modal";
import CustomerDetailsModal from "@/components/ui/customer-details-modal";
import EditCustomerModal from "@/components/ui/edit-customer-modal";
import windowCleanerService from "../../services/windowCleaner";


export default function CustomersScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const customerListRef = useRef<any>(null);

  const handleRefresh = () => {
    if (customerListRef.current?.refreshCustomers) {
      customerListRef.current.refreshCustomers();
    } else {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleOptimise = async () => {
    try {
      Alert.alert('Optimizer', 'Generating 1-week optimized schedule...', [{ text: 'OK' }]);
      
      // Define the work schedule - you can make this configurable
      const workSchedule = {
        monday_hours: 8,
        tuesday_hours: 8,
        wednesday_hours: 8,
        thursday_hours: 8,
        friday_hours: 8,
        saturday_hours: 4,
        sunday_hours: null
      };
      
      // Optional: cleaner starting location (London coordinates as default)
      const cleanerLocation = {
        lat: 51.5074,
        lng: -0.1278
      };
      
      const result = await windowCleanerService.generate1WeekSchedule(
        "947af734-4e40-44f7-8d8e-d0f304dee2dd",
        workSchedule,
        cleanerLocation
      );
      
      if (result.success) {
        console.log('Schedule generated:', result.data);
        Alert.alert('Success', 'Schedule optimized successfully!', [{ text: 'OK' }]);
      } else {
        console.error('Schedule error:', result.error);
        Alert.alert('Error', result.error || 'Failed to optimize schedule', [{ text: 'OK' }]);
      }
    } catch (error: any) {
      console.error("Error during optimisation:", error);
      Alert.alert("Optimise Error", error.message || "An error occurred while optimising.");
    }
  } 

  const handleAddCustomer = () => {
    setShowAddModal(true);
  };

  const handleCustomerAdded = () => {
    // Refresh the customer list when a new customer is added
    if (customerListRef.current?.refreshCustomers) {
      customerListRef.current.refreshCustomers();
    } else {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleEditCustomer = (customerId: string | number) => {
    // Find the customer by ID and show edit modal
    const customer = selectedCustomer; // This will be set when coming from details modal
    if (customer) {
      setShowDetailsModal(false); 
      setShowEditModal(true); 
    } 
  };

  const handleEditCustomerFromModal = (customer: any) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(false);
    setShowEditModal(true);
  };

  const handleCustomerUpdated = () => {
    // Refresh the customer list when a customer is updated
    if (customerListRef.current?.refreshCustomers) {
      customerListRef.current.refreshCustomers();
    } else {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleCustomerPress = (customer: any) => {
    console.log('🚀 Customer pressed in customers screen:', customer.name);
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };
   
     return (
       <SafeAreaView style={styles.safeArea}>
         <View style={styles.header}>
           <Text style={[styles.h1, styles.heading]}>Customers</Text>
           
           <View style={styles.buttonContainer}>
             {/* <Button 
               title="Refresh" 
               onPress={handleRefresh}
               variant="secondary"
               size="medium"
             /> */}
             <Button 
               title="Add Customer" 
               onPress={handleAddCustomer}
               variant="primary"
               size="medium"
             />
             <Button 
               title="Optimise" 
               onPress={handleOptimise}
               variant="primary"
               size="medium"
             />
           </View>
         </View>

         <ScrollView 
           style={styles.scrollContainer}
           contentContainerStyle={styles.scrollContent}
           showsVerticalScrollIndicator={true}
         >
           <CustomerList 
             ref={customerListRef}
             showEdit={true} 
             onEdit={handleEditCustomer}
             onCustomerPress={handleCustomerPress}
             key={refreshTrigger}
           />
           
           {/* <View style={[styles.buttonContainer, styles.center]}>
             <Button 
               title="View All Customers" 
               onPress={handleViewAll}
               variant="outline"
               size="medium"
               length="medium"
             />
           </View> */}
         </ScrollView>

         <AddJobModal
           visible={showAddModal}
           onClose={() => setShowAddModal(false)}
           onCustomerAdded={handleCustomerAdded}
         />

         <CustomerDetailsModal
           visible={showDetailsModal}
           customer={selectedCustomer}
           onClose={() => setShowDetailsModal(false)}
           onEdit={handleEditCustomerFromModal}
         />

         <EditCustomerModal
           visible={showEditModal}
           customer={selectedCustomer}
           onClose={() => setShowEditModal(false)}
           onCustomerUpdated={handleCustomerUpdated}
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