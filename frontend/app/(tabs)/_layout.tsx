import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

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
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="users" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounting"
        options={{
          title: 'Accounting',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="dollar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="cog" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}