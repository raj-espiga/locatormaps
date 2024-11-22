import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

const GEO_FENCING_TASK = 'GEO_FENCING_TASK';

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      startGeofencing();
    })();
  }, []);

  const startGeofencing = async () => {
    const geofence = {
      latitude: 37.78825, 
      longitude: -122.4324,
      radius: 100,  
    };

    await Location.startGeofencingAsync(GEO_FENCING_TASK, [
      {
        latitude: geofence.latitude,
        longitude: geofence.longitude,
        radius: geofence.radius,
      },
    ]);
  };

  TaskManager.defineTask(GEO_FENCING_TASK, ({ data, error }) => {
    if (error) {
      console.error(error);
      return;
    }
    const { eventType, region } = data;
    if (eventType === Location.GeofencingEventType.Enter) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'You entered the geofence!',
          body: 'You are now inside the specified area.',
        },
        trigger: { seconds: 1 },
      });
    } else if (eventType === Location.GeofencingEventType.Exit) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'You exited the geofence!',
          body: 'You are outside the specified area.',
        },
        trigger: { seconds: 1 },
      });
    }
  });

  if (errorMsg) {
    return <Text>{errorMsg}</Text>;
  }

  if (!location) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} title="You are here" />
      </MapView>
      <Text>Your current location: {location.coords.latitude}, {location.coords.longitude}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});