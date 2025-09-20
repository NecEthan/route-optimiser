import React from "react";
import { StyleSheet, Text, View, SafeAreaView, Alert } from "react-native";
import JobList from "@/components/ui/job-list";
import Button from "@/components/ui/button";

export default function TodayScreen() {
  const handleRefresh = () => {
    Alert.alert("Refresh", "Refreshing job list...");
  };

  const handleAddJob = () => {
    Alert.alert("Add Job", "Adding new job...");
  };

  const handleOptimiseRoute = () => {
    Alert.alert("Optimise Route", "Optimising route for today's jobs...");
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={[styles.h1, styles.heading]}>Today</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Refresh Jobs" 
            onPress={handleRefresh}
            variant="primary"
            size="medium"
          />
          
          <Button 
            title="Add New Job" 
            onPress={handleAddJob}
            variant="outline"
            size="medium"
          />
        </View>
        
        <JobList />
        <View style={[styles.buttonContainer, styles.center]}>
          <Button 
            title="Optimise Route" 
            onPress={handleOptimiseRoute}
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