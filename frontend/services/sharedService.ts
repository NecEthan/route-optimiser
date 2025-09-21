import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserId = async (): Promise<string | null> => {
  try {
    const userId = await AsyncStorage.getItem('user_id');
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// Additional utility functions for user ID management
export const setUserId = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('user_id', userId);
  } catch (error) {
    console.error('Error setting user ID:', error);
    throw error;
  }
};

export const clearUserId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('user_id');
  } catch (error) {
    console.error('Error clearing user ID:', error);
    throw error;
  }
};
