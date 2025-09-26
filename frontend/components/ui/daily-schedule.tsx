import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DaySchedule, ScheduleCustomer } from '@/services/scheduleService';
import OpenMapsButton from './open-google-maps';

interface DailyScheduleProps {
  schedule: DaySchedule | null;
  onCustomerPress?: (customer: ScheduleCustomer) => void;
  loading?: boolean;
}

const DailySchedule: React.FC<DailyScheduleProps> = ({ schedule, onCustomerPress, loading }) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading optimized schedule...</Text>
      </View>
    );
  }

  if (!schedule) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={48} color="#ccc" />
        <Text style={styles.emptyTitle}>No Schedule Available</Text>
        <Text style={styles.emptySubtitle}>No optimized route found for this date</Text>
      </View>
    );
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const formatCurrency = (amount: number): string => {
    return `£${amount.toFixed(2)}`;
  };

  const formatPercent = (percent: number): string => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Schedule Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.dayTitle}>{schedule.day}</Text>
            <Text style={styles.dateTitle}>{schedule.date}</Text>
          </View>
          <View style={styles.headerStats}>
            <Text style={styles.maxHours}>{schedule.max_hours}h available</Text>
          </View>
        </View>
      </View>

      {/* Daily Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="people-outline" size={20} color="#007AFF" />
          <Text style={styles.summaryValue}>{schedule.customers.length}</Text>
          <Text style={styles.summaryLabel}>Customers</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Ionicons name="cash-outline" size={20} color="#34C759" />
          <Text style={styles.summaryValue}>{formatCurrency(schedule.total_revenue)}</Text>
          <Text style={styles.summaryLabel}>Revenue</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Ionicons name="time-outline" size={20} color="#FF9500" />
          <Text style={styles.summaryValue}>{formatDuration(schedule.total_duration_minutes)}</Text>
          <Text style={styles.summaryLabel}>Work Time</Text>
        </View>
      </View>

      {/* Time Savings */}
      {schedule.time_savings && (
        <View style={styles.timeSavingsCard}>
          <View style={styles.timeSavingsHeader}>
            <Ionicons name="trending-up" size={20} color="#34C759" />
            <Text style={styles.timeSavingsTitle}>Route Optimization</Text>
          </View>
          
          <View style={styles.timeSavingsContent}>
            <View style={styles.timeSavingsStat}>
              <Text style={styles.timeSavingsValue}>
                {formatDuration(Math.abs(schedule.time_savings.time_savings_minutes))}
              </Text>
              <Text style={styles.timeSavingsLabel}>
                {schedule.time_savings.time_savings_minutes >= 0 ? 'Time Saved' : 'Extra Time'}
              </Text>
            </View>
            
            <View style={styles.timeSavingsStat}>
              <Text style={[
                styles.timeSavingsValue,
                { color: schedule.time_savings.fuel_savings_estimate_gbp >= 0 ? '#34C759' : '#FF3B30' }
              ]}>
                {formatCurrency(Math.abs(schedule.time_savings.fuel_savings_estimate_gbp))}
              </Text>
              <Text style={styles.timeSavingsLabel}>
                {schedule.time_savings.fuel_savings_estimate_gbp >= 0 ? 'Fuel Saved' : 'Extra Fuel'}
              </Text>
            </View>
            
            <View style={styles.timeSavingsStat}>
              <Text style={[
                styles.timeSavingsValue,
                { color: schedule.time_savings.efficiency_improvement_percent >= 0 ? '#34C759' : '#FF3B30' }
              ]}>
                {formatPercent(schedule.time_savings.efficiency_improvement_percent)}
              </Text>
              <Text style={styles.timeSavingsLabel}>Efficiency</Text>
            </View>
          </View>
        </View>
      )}

      {/* Customer List */}
      <View style={styles.customerSection}>
        <View style={styles.customerHeader}>
          <Text style={styles.customerTitle}>Optimized Route</Text>
          <Text style={styles.customerSubtitle}>Ordered by route optimization</Text>
        </View>
        
        {schedule.customers
          .sort((a, b) => a.route_order - b.route_order)
          .map((customer, index) => (
            <TouchableOpacity
              key={customer.id}
              style={styles.customerCard}
              onPress={() => onCustomerPress?.(customer)}
            >
              <View style={styles.customerHeader}>
                <View style={styles.routeNumber}>
                  <Text style={styles.routeNumberText}>{customer.route_order}</Text>
                </View>
                
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerAddress} numberOfLines={1}>
                    {customer.address}
                  </Text>
                </View>
                
                <View style={styles.customerStats}>
                  <Text style={styles.customerPrice}>{formatCurrency(customer.price)}</Text>
                  <Text style={styles.customerDuration}>{formatDuration(customer.estimated_duration)}</Text>
                </View>
              </View>

              <OpenMapsButton latitude={51.5074} longitude={-0.1278} />

              
              {/* Urgency Indicator */}
              {customer.days_overdue > 0 && (
                <View style={styles.urgencyBadge}>
                  <Ionicons name="alert-circle" size={12} color="#FF3B30" />
                  <Text style={styles.urgencyText}>
                    {customer.days_overdue} days overdue
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  dateTitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  maxHours: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  timeSavingsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timeSavingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeSavingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  timeSavingsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeSavingsStat: {
    alignItems: 'center',
  },
  timeSavingsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 4,
  },
  timeSavingsLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  customerSection: {
    marginBottom: 20,
  },
  customerHeader: {
    marginBottom: 16,
  },
  customerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  customerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  customerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  routeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerInfo: {
    flex: 1,
    marginRight: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#666',
  },
  customerStats: {
    alignItems: 'flex-end',
  },
  customerPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 2,
  },
  customerDuration: {
    fontSize: 12,
    color: '#666',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF2F2',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  urgencyText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default DailySchedule;