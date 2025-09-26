import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#F8F9FA',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons size={24} name="calendar-outline" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons size={24} name="people-outline" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="accounting"
        options={{
          title: 'Accounting',
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons size={24} name="card-outline" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons size={24} name="settings-outline" color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}