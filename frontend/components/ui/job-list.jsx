import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Job from "./job";
import { API_CONFIG } from '@/lib';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function JobList({ showEdit = false, onEdit, onJobPress }) {
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            
            const response = await fetch(API_CONFIG.BASE_URL + '/api/jobs', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            const data = await response.json();
            
            const jobsData = data.success && Array.isArray(data.jobs) 
                ? data.jobs 
                : data.success && Array.isArray(data.data) 
                ? data.data 
                : [];
            setJobs(jobsData);

        } catch (error) {
            console.error("❌ Error fetching jobs:", error);
            setJobs([]); 
        }
    };

    const handleJobToggle = (jobId, isChecked) => {
    };

    const handleJobPress = (job) => {
        onJobPress?.(job);
    };

    return (
        <View style={styles.container}>
            {Array.isArray(jobs) && jobs.map((job) => (
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
    },
    jobWrapper: {
        marginBottom: 12,
    },
});