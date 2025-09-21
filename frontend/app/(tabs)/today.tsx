import React, { useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, Alert, ScrollView } from "react-native";
import JobList from "@/components/ui/job-list";
import JobDetailsModal, { Job } from "@/components/ui/job-details-modal";
import Button from "@/components/ui/button";

export default function TodayScreen() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  const handleRefresh = () => {
    Alert.alert("Refresh", "Refreshing job list...");
  };

  const handleAddJob = () => {
    Alert.alert("Add Job", "Adding new job...");
  };

  const handleOptimiseRoute = () => {
    Alert.alert("Optimise Route", "Optimising route for today's jobs...");
  };

  const handleJobPress = (job: Job) => {
    console.log('🎯 Job pressed in today screen:', job.name);
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleEditJob = (job: Job) => {
    console.log('✏️ Edit job requested:', job.name);
    setShowJobDetails(false);
    Alert.alert(
      'Edit Job',
      `Edit functionality for "${job.name}" will be implemented soon.`
    );
  };

  const handleJobUpdated = (updatedJob: Job) => {
    console.log('🔄 Job updated:', updatedJob.name, 'Completed:', updatedJob.completed);
    // You can add logic here to refresh the job list or update local state
    // For now, we'll just log it
  };

  const handleCloseJobDetails = () => {
    setShowJobDetails(false);
    setSelectedJob(null);
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
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
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <JobList 
          showEdit={false} 
          onEdit={() => {}} 
          onJobPress={handleJobPress}
        />
        
        <View style={[styles.buttonContainer, styles.center]}>
          <Button 
            title="Optimise Route" 
            onPress={handleOptimiseRoute}
            variant="primary"
            size="medium"
            length="medium"
          />
        </View>
      </ScrollView>

      {/* Job Details Modal */}
      <JobDetailsModal
        visible={showJobDetails}
        job={selectedJob}
        onClose={handleCloseJobDetails}
        onEdit={handleEditJob}
        onJobUpdated={handleJobUpdated}
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