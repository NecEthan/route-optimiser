import React from "react";
import JobList from "@/components/ui/job-list";
import Button from "@/components/ui/button";
import { SafeAreaView, View, Text, Alert, StyleSheet } from "react-native";


export default function AccountingScreen() {

   const handleRefresh = () => {
         Alert.alert("Refresh", "Refreshing accounting data...");
       };
     
       const handleGenerateReport = () => {
         Alert.alert("Generate Report", "Generating financial report...");
       };
     
       const handleViewAll = () => {
         Alert.alert("View All", "Viewing all transactions...");
       };
  
       const handleEditTransaction = (transactionId: string | number) => {
         Alert.alert("Edit Transaction", `Editing transaction: ${transactionId}`);
       };
     
  return (
    <SafeAreaView style={styles.safeArea}>
             <View style={styles.container}>
               <Text style={[styles.h1, styles.heading]}>Accounting</Text>
               
               <View style={styles.buttonContainer}>
                 <Button 
                   title="Refresh Data" 
                   onPress={handleRefresh}
                   variant="primary"
                   size="medium"
                 />
                 
                 <Button 
                   title="Generate Report" 
                   onPress={handleGenerateReport}
                   variant="outline"
                   size="medium"
                 />
               </View>
               
               <JobList showEdit={true} onEdit={handleEditTransaction} />
               
               <View style={[styles.buttonContainer, styles.center]}>
                 <Button 
                   title="View All Transactions" 
                   onPress={handleViewAll}
                   variant="primary"
                   size="medium"
                   length="medium"
                 />
               </View>
             </View>
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