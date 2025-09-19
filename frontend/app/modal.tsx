import { Link } from 'expo-router';
import { View, Text } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center p-5 bg-background-light dark:bg-background-dark">
      <Text className="text-2xl font-bold mb-4 text-text-light dark:text-text-dark">
        This is a modal
      </Text>
      <Link href="/" dismissTo>
        <Text className="text-primary-light dark:text-primary-dark mt-4 py-4 underline">
          Go to home screen
        </Text>
      </Link>
    </View>
  );
}
