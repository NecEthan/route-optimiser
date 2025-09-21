import React, { useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, Alert, ScrollView } from "react-native";
import JobList from "@/components/ui/job-list";
import JobDetailsModal, { Job } from "@/components/ui/job-details-modal";
import AddJobModal from "@/components/ui/add-job-modal";
import Button from "@/components/ui/button";

export default function TodayScreen() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [jobListKey, setJobListKey] = useState(0); // Force re-render of job list
  const [hasJobUpdates, setHasJobUpdates] = useState(false); // Track if we need to refresh

  const handleRefresh = () => {
    Alert.alert("Refresh", "Refreshing job list...");
  };

  const handleAddJob = () => {
    console.log('➕ Opening add job modal');
    setShowAddJobModal(true);
  };

  const handleJobAdded = () => {
    console.log('✅ Job added successfully, refreshing job list');
    setJobListKey(prev => prev + 1); // Force refresh of job list
  };

  const handleCloseAddJobModal = () => {
    setShowAddJobModal(false);
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
    console.log('🔄 Job updated:', updatedJob.description, 'Last completed:', updatedJob.last_completed);
    
    // Update the selected job with the new data from server
    setSelectedJob(updatedJob);
    
    // Mark that we have job updates that need to be reflected in the list
    setHasJobUpdates(true);
    
    console.log('✅ Selected job state updated with server response');
  };  const handleCloseJobDetails = () => {
    setShowJobDetails(false);
    setSelectedJob(null);
    
    // If there were job updates, refresh the job list
    if (hasJobUpdates) {
      console.log('🔄 Refreshing job list due to updates...');
      setJobListKey(prev => prev + 1); // Force JobList to re-render and fetch fresh data
      setHasJobUpdates(false); // Reset the flag
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={[styles.h1, styles.heading]}>Today</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Add New Job" 
            onPress={handleAddJob}
            variant="outline"
            size="medium"
          />
        </View>
        {/* <View style={[styles.buttonContainer, styles.center]}>
          <Button 
            title="Optimise Route" 
            onPress={handleOptimiseRoute}
            variant="primary"
            size="medium"
            length="medium"
          />
        </View> */}
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
          onJobPress={handleJobPress}
        />
        
        
      </ScrollView>

      {/* Job Details Modal */}
      <JobDetailsModal
        visible={showJobDetails}
        job={selectedJob}
        onClose={handleCloseJobDetails}
        onEdit={handleEditJob}
        onJobUpdated={handleJobUpdated}
      />

      {/* Add Job Modal */}
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