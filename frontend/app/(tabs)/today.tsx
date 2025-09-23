import React, { useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, Alert, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import JobList from "@/components/ui/job-list";
import JobDetailsModal from "@/components/ui/job-details-modal";
import AddScheduleModal from "@/components/ui/add-schedule-modal";
import Button from "@/components/ui/button";
import { Customer } from "@/lib/customer-service";

interface DayOption {
  date: string; // YYYY-MM-DD format
  displayDate: string; // e.g., "Mon 23"
  dayName: string; // e.g., "Today", "Tomorrow", "Monday"
  isToday: boolean;
  isTomorrow: boolean;
}

export default function TodayScreen() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [jobListKey, setJobListKey] = useState(0); // Force re-render of job list
  const [cashPaymentStates, setCashPaymentStates] = useState<{[key: string]: boolean}>({}); // Track cash payment status for each customer
  
  // Generate days for the next 7 days starting from today
  const generateDayOptions = (): DayOption[] => {
    const options: DayOption[] = [];
    const today = new Date();
    
    for (let i = 0; i < 8; i++) { // Today + next 7 days = 8 days total
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue, etc.
      const dayNumber = date.getDate();
      
      let displayName: string;
      if (i === 0) {
        displayName = 'Today';
      } else if (i === 1) {
        displayName = 'Tomorrow';
      } else {
        displayName = dayName;
      }
      
      options.push({
        date: dateString,
        displayDate: `${dayName} ${dayNumber}`,
        dayName: displayName,
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }
    
    return options;
  };

  const dayOptions = generateDayOptions();
  const [selectedDay, setSelectedDay] = useState<string>(dayOptions[0].date); // Default to today

  const getSelectedDayInfo = () => {
    return dayOptions.find(day => day.date === selectedDay) || dayOptions[0];
  };

  const handleDaySelect = (date: string) => {
    setSelectedDay(date);
    setJobListKey(prev => prev + 1); // Refresh job list when day changes
  };

  const handleNextDay = () => {
    const currentIndex = dayOptions.findIndex(day => day.date === selectedDay);
    const nextIndex = (currentIndex + 1) % dayOptions.length; // Cycle back to start
    handleDaySelect(dayOptions[nextIndex].date);
  };

  const handlePreviousDay = () => {
    const currentIndex = dayOptions.findIndex(day => day.date === selectedDay);
    const previousIndex = currentIndex === 0 ? dayOptions.length - 1 : currentIndex - 1; // Cycle to end
    handleDaySelect(dayOptions[previousIndex].date);
  };

  const getCurrentDayIndex = () => {
    return dayOptions.findIndex(day => day.date === selectedDay);
  };

  const handleAddSchedule = () => {
    setShowAddScheduleModal(true);
  };

  const handleCloseAddJobModal = () => {
    setShowAddScheduleModal(false);
  };

  const handleCustomerPress = (customer: Customer) => {
    console.log('🎯 Customer pressed in today screen:', customer.name);
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const handleCashPaymentChange = (customerId: string, isPaidInCash: boolean) => {
    // Update cash payment state when checkbox is clicked
    setCashPaymentStates(prev => ({
      ...prev,
      [customerId]: isPaidInCash
    }));
    console.log(`💰 Cash payment status updated for customer ${customerId}: ${isPaidInCash}`);
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
    setSelectedCustomer(updatedCustomer);
  };

  const handleCustomerCompleted = (customerId: string) => {
    console.log(`✅ Customer ${customerId} completed and removed from today's list`);
    console.log('🔄 Forcing JobList refresh...');
    
    // Remove from cash payment states as well
    setCashPaymentStates(prev => {
      const updated = { ...prev };
      delete updated[customerId];
      return updated;
    });
    
    // Force refresh the JobList to show updated data
    setJobListKey(prev => prev + 1);
  };

  const handleCloseCustomerDetails = () => {
    setShowCustomerDetails(false);
    setSelectedCustomer(null);
    
    // Always refresh the customer list when modal closes
    // This ensures any completed customers are filtered out
    console.log('🔄 Modal closed - refreshing customer list...');
    setJobListKey(prev => prev + 1); // Force JobList to re-render and fetch fresh data
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Enhanced Day Navigation */}
        <View style={styles.dayNavigation}>
          <TouchableOpacity 
            style={[styles.navButton, getCurrentDayIndex() === 0 && styles.navButtonDisabled]}
            onPress={handlePreviousDay}
            disabled={getCurrentDayIndex() === 0}
          >
            <Ionicons 
              name="chevron-back" 
              size={20} 
              color={getCurrentDayIndex() === 0 ? "#ccc" : "#007AFF"} 
            />
          </TouchableOpacity>
          
          <View style={styles.dayDisplay}>
            <Text style={styles.dayTitle}>
              {getSelectedDayInfo().dayName}
            </Text>
            <Text style={styles.daySubtitle}>
              {getSelectedDayInfo().displayDate}
            </Text>
            
            {/* Day Indicator Dots */}
            <View style={styles.dayIndicators}>
              {dayOptions.map((day, index) => (
                <TouchableOpacity
                  key={day.date}
                  style={[
                    styles.dayDot,
                    index === getCurrentDayIndex() && styles.dayDotActive,
                    day.isToday && styles.dayDotToday
                  ]}
                  onPress={() => handleDaySelect(day.date)}
                >
                  {day.isToday && (
                    <View style={styles.todayIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.navButton, getCurrentDayIndex() === dayOptions.length - 1 && styles.navButtonDisabled]}
            onPress={handleNextDay}
            disabled={getCurrentDayIndex() === dayOptions.length - 1}
          >
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={getCurrentDayIndex() === dayOptions.length - 1 ? "#ccc" : "#007AFF"} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Add Schedule" 
            onPress={handleAddSchedule}
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
        {/* Show selected date info */}
        <View style={styles.dateInfo}>
          <Text style={styles.dateInfoText}>
            Showing customers for {getSelectedDayInfo().displayDate}
          </Text>
        </View>
        
        <JobList 
          key={jobListKey} // Force re-render when key changes
          onJobPress={handleCustomerPress}
          onCashPaymentChange={handleCashPaymentChange}
          onCustomerCompleted={handleCustomerCompleted}
          selectedDate={selectedDay}
        />
        
        
      </ScrollView>

      {/* Customer Details Modal */}
      <JobDetailsModal
        visible={showCustomerDetails}
        job={selectedCustomer}
        onClose={handleCloseCustomerDetails}
        onEdit={handleEditCustomer}
        onJobUpdated={handleCustomerUpdated}
        onCustomerCompleted={handleCustomerCompleted}
        cashPaymentStatus={selectedCustomer ? cashPaymentStates[selectedCustomer.id] || false : false}
      />

      {/* Add Schedule Modal */}
      <AddScheduleModal
        visible={showAddScheduleModal}
        onClose={handleCloseAddJobModal}
        onScheduleCreated={(schedule) => {
          console.log('✅ Schedule created with daily hours:', schedule.dailyHours);
          console.log('📅 Working days:', schedule.workingDays);
          console.log('⏰ Total weekly hours:', schedule.totalWeeklyHours);
          
          // Get selected days with hours for display
          const selectedDaysWithHours = Object.entries(schedule.workingDays)
            .filter(([_, selected]) => selected)
            .map(([day, _]) => {
              const hours = schedule.dailyHours[day as keyof typeof schedule.dailyHours];
              return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours}h`;
            })
            .join('\n');
          
          Alert.alert(
            'Schedule Created!',
            `Your weekly schedule:\n\n` +
            `${selectedDaysWithHours}\n\n` +
            `• ${schedule.daysCount} working days\n` +
            `• Total: ${schedule.totalWeeklyHours} hours/week\n\n` +
            `Each day has specific hours - perfect for AI optimization!`
          );
        }}
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
    paddingBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  dayNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  navButtonDisabled: {
    backgroundColor: '#f0f0f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  dayDisplay: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  dayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  daySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  dayIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  dayDotActive: {
    backgroundColor: '#007AFF',
    transform: [{ scale: 1.2 }],
  },
  dayDotToday: {
    backgroundColor: '#34C759',
  },
  todayIndicator: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#34C759',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dateInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  dateInfoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});