import React from 'react';
import { Button, Linking, Platform } from 'react-native';

interface OpenMapsButtonProps {
  latitude: number;
  longitude: number;
}

const OpenMapsButton: React.FC<OpenMapsButtonProps> = ({ latitude, longitude }) => {
  const handlePress = async () => {
    // Try Google Maps app first on both platforms
    const googleMapsUrl = Platform.select({
      ios: `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
      android: `google.navigation:q=${latitude},${longitude}&mode=d`
    }) || '';

    if (googleMapsUrl) {
      try {
        const supported = await Linking.canOpenURL(googleMapsUrl);
        if (supported) {
          await Linking.openURL(googleMapsUrl);
          return;
        }
      } catch (error) {
        console.log('Google Maps app not available, trying fallback:', error);
      }
    }

    // Fallback to default maps app or web
    const fallbackUrl = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    }) || `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    try {
      const supported = await Linking.canOpenURL(fallbackUrl);
      if (supported) {
        await Linking.openURL(fallbackUrl);
      } else {
        console.log("Can't open any maps URL");
      }
    } catch (err) {
      console.error('An error occurred opening maps:', err);
    }
  };

  return <Button title="Open in Google Maps" onPress={handlePress} />;
};

export default OpenMapsButton;
