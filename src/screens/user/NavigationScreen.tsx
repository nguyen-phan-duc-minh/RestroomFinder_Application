import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../../App';
import { useUser } from '../../context/UserContext';
import { Restroom, Location as LocationType } from '../../types';
import { api, calculateDistance } from '../../services/api';

// OpenRouteService API for free routing (5000 requests per day)
const OPENROUTE_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZmNmZlMmI0MDIyNzQzM2ZhN2IxMGRkOGZlZDM4ZjQ2IiwiaCI6Im11cm11cjY0In0='; // Free key
const getRoute = async (start: LocationType, end: LocationType) => {
  try {
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${OPENROUTE_API_KEY}&start=${start.longitude},${start.latitude}&end=${end.longitude},${end.latitude}`
    );
    const data = await response.json();
    if (data.features && data.features[0]) {
      const coordinates = data.features[0].geometry.coordinates;
      return coordinates.map((coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));
    }
  } catch (error) {
    console.error('Error getting route:', error);
  }
  return null;
};

type NavigationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Navigation'>;
type NavigationScreenRouteProp = RouteProp<RootStackParamList, 'Navigation'>;

const { width, height } = Dimensions.get('window');

const NavigationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationScreenNavigationProp>();
  const route = useRoute<NavigationScreenRouteProp>();
  const { restaurantId } = route.params;
  const { user, generateRandomUser } = useUser();

  const [restroom, setRestroom] = useState<Restroom | null>(null);
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<LocationType[]>([]);

  useEffect(() => {
    fetchRestroomDetail();
    startLocationTracking();
  }, [restaurantId]);

  useEffect(() => {
    if (userLocation && restroom && isTracking) {
      const currentDistance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        restroom.latitude,
        restroom.longitude
      );
      setDistance(currentDistance);
      
      // Get route on first load or when user location changes significantly
      if (routeCoordinates.length === 0) {
        getRoute(userLocation, { latitude: restroom.latitude, longitude: restroom.longitude })
          .then(route => {
            if (route) {
              setRouteCoordinates(route);
            }
          });
      }
      
      // Check if user has arrived (within 50 meters)
      if (currentDistance <= 50 && !hasArrived) {
        setHasArrived(true);
        showArrivalAlert();
      }
    }
  }, [userLocation, restroom, isTracking]);

  const fetchRestroomDetail = async () => {
    try {
      const data = await api.getRestroomDetail(restaurantId);
      setRestroom(data);
    } catch (error) {
      console.error('Error fetching restroom detail:', error);
      Alert.alert('Error', 'Could not load destination details.');
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for navigation.');
        return;
      }

      setIsTracking(true);
      
      // Get initial location
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Start watching position
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Could not start navigation. Please try again.');
    }
  };

  const showArrivalAlert = () => {
    Alert.alert(
      'Bạn đã đến nơi!',
      'Để bắt đầu sử dụng nhà vệ sinh, vui lòng nhấn "Bắt đầu"',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Bắt đầu',
          onPress: handleStartUsing,
        },
      ]
    );
  };

  const handleArrival = () => {
    // Manually trigger arrival alert (same as automatic detection)
    showArrivalAlert();
  };

  const handleStartUsing = async () => {
    console.log('handleStartUsing called');
    
    if (!restroom) {
      console.log('Missing restroom');
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhà vệ sinh');
      return;
    }

    // If no user, generate a random user
    let currentUser = user;
    if (!currentUser) {
      console.log('No user found, generating random user...');
      try {
        currentUser = await generateRandomUser();
        console.log('Generated random user:', currentUser);
      } catch (error) {
        console.error('Error generating random user:', error);
        Alert.alert('Lỗi', 'Không thể tạo người dùng. Vui lòng thử lại.');
        return;
      }
    }

    if (!currentUser || !currentUser.id) {
      console.error('Invalid user:', currentUser);
      Alert.alert('Lỗi', 'Người dùng không hợp lệ. Vui lòng thử lại.');
      return;
    }

    try {
      console.log('User ID:', currentUser.id, 'Restroom ID:', restroom.id);
      console.log('Notifying arrival...');
      
      // First notify arrival to owner
      try {
        await api.notifyArrival(restroom.id, currentUser.id);
        console.log('Arrival notified successfully');
      } catch (notifyError) {
        console.error('Error notifying arrival:', notifyError);
        // Continue anyway, this is not critical
      }
      
      console.log('Checking restroom payment requirements...');
      console.log('Restroom is_free:', restroom.is_free, 'Price:', restroom.price);
      
      // Check if restroom requires payment
      if (!restroom.is_free && restroom.price > 0) {
        console.log('Restroom requires payment, navigating to Payment screen...');
        navigation.navigate('Payment', {
          restaurantId: restroom.id,
          restroomName: restroom.name,
          price: restroom.price,
        });
        return;
      }
      
      console.log('Starting restroom usage (free restroom)...');
      console.log('Current user:', currentUser);
      console.log('Restroom:', restroom);
      
      // For free restrooms, start using directly
      const result = await api.startUsingRestroom(currentUser.id, restroom.id);
      console.log('Start using result:', result);
      
      if (result.success) {
        console.log('Navigating to Usage screen...');
        navigation.navigate('Usage', { restaurantId: restroom.id });
      } else if (result.requiresPayment) {
        console.log('Payment required, navigating to Payment screen...');
        navigation.navigate('Payment', {
          restaurantId: restroom.id,
          restroomName: restroom.name,
          price: restroom.price,
        });
      } else {
        console.error('startUsingRestroom failed:', result.error);
        // Show retry option with offline mode
        Alert.alert(
          'Lỗi kết nối', 
          'Không thể kết nối đến server. Bạn có muốn tiếp tục ở chế độ offline không?',
          [
            {
              text: 'Hủy',
              style: 'cancel'
            },
            {
              text: 'Tiếp tục offline',
              onPress: () => {
                console.log('Using offline mode, navigating to Usage screen...');
                navigation.navigate('Usage', { restaurantId: restroom.id });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error starting restroom usage:', error);
      Alert.alert('Lỗi mạng', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại.');
    }
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) return `${distance}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  if (!restroom || !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  const mapRegion = {
    latitude: (userLocation.latitude + restroom.latitude) / 2,
    longitude: (userLocation.longitude + restroom.longitude) / 2,
    latitudeDelta: Math.abs(userLocation.latitude - restroom.latitude) * 2 + 0.01,
    longitudeDelta: Math.abs(userLocation.longitude - restroom.longitude) * 2 + 0.01,
  };

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      {/* <View style={styles.navigationHeader}>
        <Text style={styles.destinationName}>{restroom.name}</Text>
        <Text style={styles.address}>{restroom.address}</Text>
        {distance && (
          <Text style={styles.distanceText}>
            Còn cách {formatDistance(distance)}
          </Text>
        )}
      </View> */}

      {/* Map */}
      <MapView
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {/* Destination Marker */}
        <Marker
          coordinate={{
            latitude: restroom.latitude,
            longitude: restroom.longitude,
          }}
          title={restroom.name}
          description="Điểm đến"
        >
          <View style={styles.destinationMarker}>
            <Ionicons name="flag" size={24} color="#FF4444" />
          </View>
        </Marker>

        {/* Route Line */}
        {routeCoordinates.length > 0 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        ) : (
          <Polyline
            coordinates={[
              userLocation,
              { latitude: restroom.latitude, longitude: restroom.longitude }
            ]}
            strokeColor="#007AFF"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>

      {/* Navigation Controls */}
      <View style={styles.controlsContainer}>
        {hasArrived ? (
          <TouchableOpacity style={styles.arrivalButton} onPress={handleStartUsing}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.arrivalButtonText}>Bắt đầu sử dụng</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <View style={styles.navigationInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="navigate" size={20} color="#007AFF" />
                <Text style={styles.infoText}>Đang dẫn đường...</Text>
              </View>
              {distance && (
                <View style={styles.infoItem}>
                  <Ionicons name="location" size={20} color="#666" />
                  <Text style={styles.directionText}>
                    Khoảng cách: {formatDistance(distance)}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Test button to simulate arrival */}
            <TouchableOpacity style={styles.testArrivalButton} onPress={handleArrival}>
              <Text style={styles.testArrivalButtonText}>Đã đến nơi</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationHeader: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  destinationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  distanceText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 8,
  },
  map: {
    flex: 1,
  },
  destinationMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  controlsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderTopRightRadius: 40,
    borderTopLeftRadius: 40,
  },
  arrivalButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  arrivalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  navigationInfo: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#5271ff',
  },
  directionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  cancelButton: {
    backgroundColor: '#FF4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testArrivalButton: {
    backgroundColor: '#00bf63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  testArrivalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default NavigationScreen;