import React from 'react';
import { Button, Linking, Platform } from 'react-native';

const OpenMapsButton = ({ latitude, longitude }) => {
  const handlePress = () => {
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    });

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          console.log("Can't open URL:", url);
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  return <Button title="Get Route" onPress={handlePress} />;
};

export default OpenMapsButton;
