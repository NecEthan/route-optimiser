import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Job from "./job";
import { API_CONFIG } from '@/lib';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function JobList({ showEdit = false, onEdit, onJobPress }) {
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            
            const response = await fetch(API_CONFIG.BASE_URL + '/api/customers', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            console.log("Got customers:", data);
            
            const customers = Array.isArray(data) ? data : data.data || [];
            setJobs(customers);

        } catch (error) {
            console.error("Error:", error);
            setJobs([]);
        }
    };

    const handleJobToggle = (jobId, isChecked) => {
        console.log(`Job ${jobId} ${isChecked ? 'completed' : 'unchecked'}`);
    };

    const handleJobPress = (job) => {
        console.log('🎯 Job pressed:', job.name);
        onJobPress?.(job);
    };

    return (
        <View style={styles.container}>
            {jobs.map((job) => (
                <View key={job.id} style={styles.jobWrapper}>
                    <Job 
                        job={job} 
                        onToggle={(isChecked) => handleJobToggle(job.id, isChecked)}
                        onEdit={onEdit}
                        onPress={() => handleJobPress(job)}
                        showEdit={showEdit}
                    />
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // Don't use ScrollView or flex: 1 here
    },
    jobWrapper: {
        marginBottom: 12,
    },
});