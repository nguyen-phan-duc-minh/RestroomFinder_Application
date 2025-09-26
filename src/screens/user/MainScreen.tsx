import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
  PanResponder,
  Animated,
  Image,
  ScrollView,
} from 'react-native';
import ImageViewer from '../../components/ImageViewer';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../../App';
import { useUser } from '../../context/UserContext';
import { Restroom, Location as LocationType } from '../../types';
import { api, calculateDistance } from '../../services/api';

const { width, height } = Dimensions.get('window');

const MainScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [restrooms, setRestrooms] = useState<Restroom[]>([]);
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 10.7769,
    longitude: 106.7009,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [loading, setLoading] = useState(true);
  const [listHeight] = useState(new Animated.Value(height * 0.35));
  const [initialHeight] = useState(height * 0.35);
  
  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  useEffect(() => {
    requestLocationPermission();
    fetchRestrooms();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show nearby restrooms.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userLoc: LocationType = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(userLoc);
      setMapRegion({
        latitude: userLoc.latitude,
        longitude: userLoc.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location. Using default location.');
    }
  };

  const fetchRestrooms = async () => {
    try {
      const data = await api.getRestrooms();
      setRestrooms(data);
    } catch (error) {
      console.error('Error fetching restrooms:', error);
      Alert.alert('Error', 'Could not load restrooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const restroomsWithDistance = restrooms.map(restroom => {
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        restroom.latitude,
        restroom.longitude
      );
      return { ...restroom, distance };
    }
    return restroom;
  }).sort((a, b) => (a.distance || 0) - (b.distance || 0));

  const formatDistance = (distance?: number): string => {
    if (!distance) return 'Unknown';
    if (distance < 1000) return `${distance}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const handleMarkerPress = (restroom: Restroom) => {
    (navigation as any).navigate('RestaurantDetail', { restaurantId: restroom.id });
  };

  const handleRestroomPress = (restroom: Restroom) => {
    (navigation as any).navigate('RestaurantDetail', { restaurantId: restroom.id });
  };

  const refreshData = () => {
    fetchRestrooms();
  };

  const openImageViewer = (images: string[], initialIndex: number = 0) => {
    setViewerImages(images);
    setViewerInitialIndex(initialIndex);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setViewerImages([]);
    setViewerInitialIndex(0);
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
    },
    onPanResponderGrant: () => {
      const currentValue = (listHeight as any)._value;
      listHeight.setOffset(currentValue);
      listHeight.setValue(0);
    },
    onPanResponderMove: (evt, gestureState) => {
      const newValue = -gestureState.dy;
      listHeight.setValue(newValue);
    },
    onPanResponderRelease: (evt, gestureState) => {
      listHeight.flattenOffset();
      
      const velocity = gestureState.vy;
      const currentValue = (listHeight as any)._value;
      
      let targetHeight;
      
      // Xác định target height dựa trên velocity và vị trí hiện tại
      if (velocity > 500) {
        targetHeight = height * 0.2; // Kéo xuống nhanh -> collapse
      } else if (velocity < -500) {
        targetHeight = height * 0.7; // Kéo lên nhanh -> expand
      } else {
        // Dựa trên vị trí hiện tại
        if (currentValue < height * 0.28) {
          targetHeight = height * 0.2;
        } else if (currentValue > height * 0.5) {
          targetHeight = height * 0.7;
        } else {
          targetHeight = height * 0.35;
        }
      }
      
      // Đảm bảo target nằm trong giới hạn
      targetHeight = Math.max(height * 0.2, Math.min(height * 0.8, targetHeight));
      
      // Animation mượt hơn
      Animated.spring(listHeight, {
        toValue: targetHeight,
        useNativeDriver: false,
        tension: 80,
        friction: 8,
      }).start();
    },
  });

  const getImageUrl = (originalUrl: string | null | undefined, fallbackIndex: number = 0): string => {
    const fallbackUrls = [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=120&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=120&fit=crop',
      'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=200&h=120&fit=crop',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=120&fit=crop',
      'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=200&h=120&fit=crop',
    ];

    if (!originalUrl || originalUrl.includes('via.placeholder.com')) {
      return fallbackUrls[fallbackIndex % fallbackUrls.length];
    }

    if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
      return originalUrl;
    }

    if (originalUrl.startsWith('/')) {
      return `http://10.10.123.5:5002${originalUrl}`;
    }

    return originalUrl;
  };

  const renderRestroomItem = ({ item }: { item: Restroom }) => (
    <TouchableOpacity style={[styles.restroomItem, styles.greenCard]} onPress={() => handleRestroomPress(item)}>
      {/* Header with Name and Rating */}
      <View style={styles.restroomHeader}>
        <Text style={[styles.restroomName, styles.whiteText]} numberOfLines={1}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={[styles.rating, styles.whiteText]}>5.0</Text>
        </View>
      </View>
      
      {/* Address */}
      <Text style={[styles.address, styles.addressText]} numberOfLines={2}>{item.address}</Text>
      
      {/* Details */}
      <View style={styles.restroomDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location" size={16} color="#ff5757" />
          <Text style={[styles.detailText, styles.distanceText]}>{formatDistance(item.distance)}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="people" size={16} color="#5271ff" />
          <Text style={[styles.detailText, styles.counterText]}>{item.current_users} người</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons 
            name={item.is_free ? "checkmark-circle" : "cash"} 
            size={16} 
            color={item.is_free ? "#00bf63" : "#b1b1b1"}
          />
          <Text style={[styles.detailText, styles.whiteText, item.is_free && styles.freeText]}>
            {item.is_free ? "Miễn phí" : `${item.price.toLocaleString()} VNĐ`}
          </Text>
        </View>
      </View>
      
      {/* Images Section - Scrollable */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.imagesScrollView}
        contentContainerStyle={styles.imagesContainer}
      >
        {(() => {
          // Use images array if available (uploaded by owner), otherwise use fallback
          const imagesToShow = item.images && item.images.length > 0 
            ? item.images.slice(0, 3) // Show max 3 images
            : [
                getImageUrl(item.image_url, item.id),
                getImageUrl(item.image_url, item.id + 1),
                getImageUrl(item.image_url, item.id + 2)
              ];

          return imagesToShow.map((imageUrl, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.imageItem}
              onPress={() => openImageViewer(imagesToShow, index)}
            >
              <Image 
                source={{ uri: imageUrl }}
                style={styles.itemImage}
                resizeMode="cover"
                onError={() => {
                  // Silent error handling
                }}
              />
            </TouchableOpacity>
          ));
        })()}
      </ScrollView>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user && (
        <View style={styles.userHeader}>
          <Text style={styles.welcomeText}>Xin chào, {user.username}!</Text>
        </View>
      )}
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {restrooms.map(restroom => (
            <Marker
              key={restroom.id}
              coordinate={{
                latitude: restroom.latitude,
                longitude: restroom.longitude,
              }}
              title={restroom.name}
              description={restroom.address}
              onPress={() => handleMarkerPress(restroom)}
            >
              <View style={styles.customMarker}>
                <Ionicons 
                  name="restaurant" 
                  size={20} 
                  color={restroom.is_free ? "#4CAF50" : "#FF9800"} 
                />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>
      
      <Animated.View style={[styles.listContainer, { height: listHeight }]}>
        <View style={styles.dragHandle} {...panResponder.panHandlers}>
          <View style={styles.dragIndicator} />
        </View>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Toilets</Text>
          <TouchableOpacity onPress={refreshData} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#00bf63" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={restroomsWithDistance}
          renderItem={renderRestroomItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          bounces={true}
          style={styles.flatListStyle}
        />
      </Animated.View>
      
      {/* Image Viewer Modal */}
      <ImageViewer
        visible={imageViewerVisible}
        images={viewerImages}
        initialIndex={viewerInitialIndex}
        onClose={closeImageViewer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userHeader: {
    backgroundColor: '#00bf63',
    padding: 16,
  },
  welcomeText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00bf63',
  },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: height * 0.8,
    minHeight: height * 0.2,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    color: '#333',
  },
  restroomItem: {
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greenCard: {
    backgroundColor: '#fff',
  },
  restroomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  restroomName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  address: {
    fontSize: 14,
    color: '#f5f5f5',
    marginBottom: 10,
    marginLeft: 3,
    lineHeight: 18,
  },
  restroomDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#666',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 8,
    marginRight: 8,
  },
  refreshButton: {
    paddingHorizontal: 10,
  },


  whiteText: {
    color: 'black',
  },
  distanceText: {
    color: '#ff5757',
  },
  counterText: {
    color: '#5271ff',
  },
  addressText: {
    color: '#666',
  },
  dragHandle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    width: '100%',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#bbb',
    borderRadius: 2,
  },
  flatListStyle: {
    flex: 1,
    borderRadius: 26,
  },
  freeText: {
    color: '#00bf63',
  },
  itemContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  imagesScrollView: {
    marginTop: 14,
  },
  imagesContainer: {
    paddingRight: 20,
  },
  imageItem: {
    width: 120,
    height: 100,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
});

export default MainScreen;