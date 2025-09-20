import React, { useState, useRef } from "react";
import { Alert, SafeAreaView, View, StyleSheet, Text, ScrollView } from "react-native";
import Button from "@/components/ui/button";
import CustomerList from "@/components/ui/customer-list";
import AddCustomerModal from "@/components/ui/add-customer-modal";

export default function CustomersScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const customerListRef = useRef<any>(null);

  const handleRefresh = () => {
    if (customerListRef.current?.refreshCustomers) {
      customerListRef.current.refreshCustomers();
    } else {
      setRefreshTrigger(prev => prev + 1);
    }
  };

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

  const handleViewAll = () => {
    Alert.alert("View All", "Viewing all customers...");
  };

  const handleEditCustomer = (customerId: string | number) => {
    Alert.alert("Edit Customer", `Editing customer: ${customerId}`);
  };
   
     return (
       <SafeAreaView style={styles.safeArea}>
         <View style={styles.header}>
           <Text style={[styles.h1, styles.heading]}>Customers</Text>
           
           <View style={styles.buttonContainer}>
             <Button 
               title="Refresh" 
               onPress={handleRefresh}
               variant="secondary"
               size="medium"
             />
             <Button 
               title="Add Customer" 
               onPress={handleAddCustomer}
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
             key={refreshTrigger}
           />
           
           <View style={[styles.buttonContainer, styles.center]}>
             <Button 
               title="View All Customers" 
               onPress={handleViewAll}
               variant="outline"
               size="medium"
               length="medium"
             />
           </View>
         </ScrollView>

         <AddCustomerModal
           visible={showAddModal}
           onClose={() => setShowAddModal(false)}
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