import React, { useState, useRef } from "react";
import { Alert, SafeAreaView, View, StyleSheet, Text } from "react-native";
import Button from "@/components/ui/button";
import CustomerList from "@/components/ui/customer-list";
import AddCustomerModal from "@/components/ui/add-customer-modal";

export default function CustomersScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const customerListRef = useRef<any>(null);

  const handleRefresh = () => {
    // Trigger refresh of the customer list
    if (customerListRef.current?.refreshCustomers) {
      customerListRef.current.refreshCustomers();
    }
    Alert.alert("Refresh", "Customer list refreshed!");
  };

  const handleAddCustomer = () => {
    setShowAddModal(true);
  };

  const handleCustomerAdded = () => {
    // Refresh the customer list when a new customer is added
    if (customerListRef.current?.refreshCustomers) {
      customerListRef.current.refreshCustomers();
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
         <View style={styles.container}>
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
           
           <CustomerList 
             ref={customerListRef}
             showEdit={true} 
             onEdit={handleEditCustomer} 
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
         </View>

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
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});