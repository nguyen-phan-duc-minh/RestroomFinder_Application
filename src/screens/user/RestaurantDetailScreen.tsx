import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageViewer from '../../components/ImageViewer';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../../App';
import { RestroomDetail, Review } from '../../types';
import { api } from '../../services/api';
import { useUser } from '../../context/UserContext';

type RestaurantDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RestaurantDetail'>;
type RestaurantDetailScreenRouteProp = RouteProp<RootStackParamList, 'RestaurantDetail'>;

const { width } = Dimensions.get('window');

const RestaurantDetailScreen: React.FC = () => {
  const navigation = useNavigation<RestaurantDetailScreenNavigationProp>();
  const route = useRoute<RestaurantDetailScreenRouteProp>();
  const { restaurantId } = route.params;
  const { user } = useUser();

  const [restroom, setRestroom] = useState<RestroomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  
  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  // Fallback image URLs that work reliably
  const getFallbackImageUrls = (): string[] => [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=300&fit=crop',
  ];

  // Helper function to get a working image URL with fallbacks
  const getImageUrl = (originalUrl: string | null | undefined, fallbackIndex: number = 0): string | null => {
    if (!originalUrl) {
      const fallbacks = getFallbackImageUrls();
      return fallbacks[fallbackIndex % fallbacks.length];
    }
    
    // Replace via.placeholder with working alternatives
    if (originalUrl.includes('via.placeholder.com')) {
      const fallbacks = getFallbackImageUrls();
      return fallbacks[fallbackIndex % fallbacks.length];
    }
    
    // If it's already a working URL, return it
    if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
      return originalUrl;
    }
    
    // If it's a relative path, prepend API base URL
    if (originalUrl.startsWith('/')) {
      return `http://10.10.123.5:5002${originalUrl}`;
    }
    
    return originalUrl;
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

  useEffect(() => {
    fetchRestroomDetail();
  }, [restaurantId]);

  const fetchRestroomDetail = async () => {
    try {
      const data = await api.getRestroomDetail(restaurantId);
      console.log('Fetched restroom data:', data);
      console.log('Image URL from API:', data?.image_url);
      console.log('Images array from API:', data?.images);
      console.log('Images array length:', data?.images?.length || 0);
      setRestroom(data);
      // Reset image states when new data is loaded
      setImageError(false);
      setImageLoading(true);
      setFallbackIndex(0);
    } catch (error) {
      console.error('Error fetching restroom detail:', error);
      Alert.alert('Error', 'Could not load restroom details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirections = async () => {
    if (restroom) {
      // Send navigation request to owner
      try {
        await api.requestNavigation(restroom.id, user?.id);
      } catch (error) {
        console.error('Error sending navigation request:', error);
      }
      
      navigation.navigate('Navigation', { restaurantId: restroom.id });
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const renderReview = (review: Review) => (
    <View key={review.id} style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewStars}>
          {renderStars(review.rating)}
        </View>
        <Text style={styles.reviewDate}>
          {new Date(review.created_at).toLocaleDateString('vi-VN')}
        </Text>
      </View>
      {review.comment && (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      )}
      {getImageUrl(review.image_path) && (
        <TouchableOpacity 
          style={styles.reviewImageContainer}
          onPress={() => {
            const reviewImageUrl = getImageUrl(review.image_path);
            if (reviewImageUrl) {
              openImageViewer([reviewImageUrl], 0);
            }
          }}
        >
          <Image 
            source={{ uri: getImageUrl(review.image_path)! }} 
            style={styles.reviewImage}
            resizeMode="cover"
            onError={(error) => {
              console.log('Error loading review image:', error.nativeEvent);
              console.log('Failed review image URL:', getImageUrl(review.image_path));
            }}
            onLoad={() => {
              console.log('Review image loaded successfully:', getImageUrl(review.image_path));
            }}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  if (!restroom) {
    return (
      <View style={styles.errorContainer}>
        <Text>Không tìm thấy thông tin nhà vệ sinh</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Hero Image */}
      {!imageError ? (
        <TouchableOpacity 
          style={styles.heroImageContainer}
          onPress={() => {
            // Create images array for viewer
            const imagesToView = restroom.images && restroom.images.length > 0 
              ? restroom.images 
              : [getImageUrl(restroom.image_url, restroom.id + fallbackIndex)!].filter(Boolean);
            openImageViewer(imagesToView, 0);
          }}
        >
          <Image 
            key={`image-${fallbackIndex}`} 
            source={{ 
              uri: (() => {
                // Use first image from images array if available, otherwise use fallback
                if (restroom.images && restroom.images.length > 0) {
                  return restroom.images[0];
                }
                return getImageUrl(restroom.image_url, restroom.id + fallbackIndex)!;
              })()
            }} 
            style={styles.heroImage}
            resizeMode="cover"
            onLoadStart={() => {
              const imageUrl = restroom.images && restroom.images.length > 0 
                ? restroom.images[0] 
                : getImageUrl(restroom.image_url, restroom.id + fallbackIndex);
              console.log('Image loading started:', imageUrl);
              setImageLoading(true);
            }}
            onLoad={() => {
              const imageUrl = restroom.images && restroom.images.length > 0 
                ? restroom.images[0] 
                : getImageUrl(restroom.image_url, restroom.id + fallbackIndex);
              console.log('Image loaded successfully:', imageUrl);
              setImageLoading(false);
            }}
            onError={(error) => {
              console.log('Error loading hero image:', error.nativeEvent);
              const imageUrl = restroom.images && restroom.images.length > 0 
                ? restroom.images[0] 
                : getImageUrl(restroom.image_url, restroom.id + fallbackIndex);
              console.log('Failed Image URL:', imageUrl);
              
              // If using uploaded image and it fails, try fallback system
              if (restroom.images && restroom.images.length > 0 && fallbackIndex === 0) {
                setFallbackIndex(1); // Start using fallback images
                setImageLoading(true);
              } else if (fallbackIndex < 4) {
                setFallbackIndex(prev => prev + 1);
                setImageLoading(true);
              } else {
                setImageError(true);
                setImageLoading(false);
              }
            }}
          />
          {imageLoading && (
            <View style={styles.imageLoadingOverlay}>
              <Text style={styles.loadingText}>...</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={[styles.heroImage, styles.placeholderImage]}>
          <Ionicons name="image" size={50} color="#ccc" />
          <Text style={styles.placeholderText}>
            {!(restroom.images && restroom.images.length > 0) && !restroom.image_url ? 'Không có ảnh' : 'Lỗi tải ảnh'}
          </Text>
          <>
            <Text style={styles.debugText}>Images Array: {restroom.images ? JSON.stringify(restroom.images) : 'N/A'}</Text>
            <Text style={styles.debugText}>Original: {restroom.image_url || 'N/A'}</Text>
            <Text style={styles.debugText}>Using: {restroom.images && restroom.images.length > 0 ? restroom.images[0] : getImageUrl(restroom.image_url, restroom.id + fallbackIndex)}</Text>
            <Text style={styles.debugText}>Fallback Index: {fallbackIndex}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                console.log('Reset fallback and retry');
                setFallbackIndex(0);
                setImageError(false);
                setImageLoading(true);
              }}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </>
        </View>
      )}

      {/* Basic Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{restroom.name}</Text>
        <Text style={styles.address}>{restroom.address}</Text>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {renderStars(5)}
          </View>
          <Text style={styles.ratingText}>
            5.0 ({restroom.reviews?.length || restroom.total_reviews || 0} đánh giá)
          </Text>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="people" size={20} color="#666" />
            <Text style={styles.detailText}>
              Hiện có {restroom.current_users} người đang sử dụng
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons 
              name={restroom.is_free ? "checkmark-circle" : "cash"} 
              size={20} 
              color={restroom.is_free ? "#4CAF50" : "#FF9800"} 
            />
            <Text style={[styles.detailText, { 
              color: restroom.is_free ? "#4CAF50" : "#FF9800" 
            }]}>
              {restroom.is_free ? "Miễn phí" : `${restroom.price.toLocaleString()} VNĐ`}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="mail" size={20} color="#666" />
            <Text style={styles.detailText}>
              Liên hệ: {restroom.admin_contact}
            </Text>
          </View>
        </View>

        {/* Direction Button */}
        <TouchableOpacity style={styles.directionButton} onPress={handleDirections}>
          <Ionicons name="navigate" size={18} color="white" />
          <Text style={styles.directionButtonText}>Chỉ đường</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews Section */}
      <View style={styles.reviewsContainer}>
        <Text style={styles.reviewsTitle}>Đánh giá từ người dùng</Text>
        {restroom.reviews.length > 0 ? (
          restroom.reviews.map(renderReview)
        ) : (
          <Text style={styles.noReviews}>Chưa có đánh giá nào</Text>
        )}
      </View>
      
      {/* Image Viewer Modal */}
      <ImageViewer
        visible={imageViewerVisible}
        images={viewerImages}
        initialIndex={viewerInitialIndex}
        onClose={closeImageViewer}
      />
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: width,
    height: 350,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 25,
    marginBottom: 16,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  address: {
    fontSize: 16,
    marginLeft: 1,
    color: '#666',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#333',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  directionButton: {
    backgroundColor: '#00bf63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  directionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reviewsContainer: {
    backgroundColor: 'white',
    padding: 20,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewImage: {
    width: '100%',
    borderRadius: 8,
  },
  noReviews: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  heroImageContainer: {
    position: 'relative',
    width: width,
    height: 250,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#00bf63',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewImageContainer: {
    marginTop: 8,
  },
});

export default RestaurantDetailScreen;