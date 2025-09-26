import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../../App';
import { useUser } from '../../context/UserContext';
import { api } from '../../services/api';

type ReviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Review'>;
type ReviewScreenRouteProp = RouteProp<RootStackParamList, 'Review'>;

const ReviewScreen: React.FC = () => {
  const navigation = useNavigation<ReviewScreenNavigationProp>();
  const route = useRoute<ReviewScreenRouteProp>();
  const { restaurantId } = route.params;
  const { user } = useUser();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const quickComments = [
    'Sạch sẽ, thoáng mát',
    'Giá cả hợp lý',
    'Phục vụ nhanh chóng',
    'Nhân viên thân thiện',
    'Nhà vệ sinh sạch',
    'Đầy đủ tiện ích',
  ];

  const handleImagePicker = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Denied', 'Permission to access camera roll is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not pick image. Please try again.');
    }
  };

  const handleSubmitReview = async () => {
    // Rating đã có mặc định 5 sao, không cần validate

    if (!user) {
      Alert.alert('Error', 'User information not found.');
      return;
    }

    setSubmitting(true);

    try {
      // In a real app, you would upload the image to a server first
      // For now, we'll just use the local URI
      const reviewData = {
        restroom_id: restaurantId,
        user_id: user.id,
        rating,
        comment: comment.trim(),
        image_path: selectedImage || undefined,
      };

      const success = await api.createReview(reviewData);
      
      if (success) {
        Alert.alert(
          'Cảm ơn bạn!',
          'Đánh giá của bạn đã được gửi thành công.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('MainTabs' as never),
            },
          ]
        );
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Could not submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStar = (starNumber: number) => {
    const isFilled = starNumber <= rating;
    return (
      <TouchableOpacity
        key={starNumber}
        onPress={() => setRating(starNumber)}
        style={styles.starButton}
      >
        <Ionicons
          name={isFilled ? 'star' : 'star-outline'}
          size={40}
          color="#FFD700"
        />
      </TouchableOpacity>
    );
  };

  const addQuickComment = (quickComment: string) => {
    if (comment.length > 0) {
      setComment(prev => prev + ' ' + quickComment);
    } else {
      setComment(quickComment);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        {/* <View style={styles.header}>
          <Ionicons name="star" size={32} color="#FFD700" />
          <Text style={styles.title}>Đánh giá trải nghiệm</Text>
          <Text style={styles.subtitle}>
            Chia sẻ trải nghiệm của bạn để giúp người khác
          </Text>
        </View> */}

        {/* Star Rating */}
        <View style={styles.ratingContainer}>
          <Text style={styles.sectionTitle}>Bạn đánh giá bao nhiêu sao?</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map(renderStar)}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating} sao - {
                rating === 1 ? 'Rất tệ' :
                rating === 2 ? 'Tệ' :
                rating === 3 ? 'Bình thường' :
                rating === 4 ? 'Tốt' : 'Rất tốt'
              }
            </Text>
          )}
        </View>

        {/* Quick Comments */}
        {/* <View style={styles.quickCommentsContainer}>
          <Text style={styles.sectionTitle}>Bình luận nhanh</Text>
          <View style={styles.quickCommentsGrid}>
            {quickComments.map((quickComment, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickCommentButton}
                onPress={() => addQuickComment(quickComment)}
              >
                <Text style={styles.quickCommentText}>{quickComment}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View> */}

        {/* Comment Input */}
        <View style={styles.commentContainer}>
          <Text style={styles.sectionTitle}>Phản hồi</Text>
           <View style={styles.quickCommentsGrid}>
            {quickComments.map((quickComment, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickCommentButton}
                onPress={() => addQuickComment(quickComment)}
              >
                <Text style={styles.quickCommentText}>{quickComment}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.commentInput}
            multiline
            numberOfLines={4}
            placeholder="Chia sẻ trải nghiệm chi tiết của bạn..."
            value={comment}
            onChangeText={setComment}
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {comment.length}/500 ký tự
          </Text>

          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePicker}>
              <Ionicons name="camera" size={32} color="#007AFF" />
              <Text style={styles.imagePickerText}>Chọn hình ảnh</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Image Upload */}
        {/* <View style={styles.imageContainer}>
          <Text style={styles.sectionTitle}>Thêm hình ảnh (tùy chọn)</Text>
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePicker}>
              <Ionicons name="camera" size={32} color="#00bf63" />
              <Text style={styles.imagePickerText}>Chọn hình ảnh</Text>
            </TouchableOpacity>
          )}
        </View> */}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitReview}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Text>
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.navigate('MainTabs' as never)}
        >
          <Text style={styles.skipButtonText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  ratingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  quickCommentsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  quickCommentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 12,
    gap: 2,
  },
  quickCommentButton: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    minWidth: '48%',
  },
  quickCommentText: {
    fontSize: 13,
    color: '#007AFF',
    textAlign: 'center',
  },
  commentContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  imageContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    padding: 18,
    marginBottom: 10,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReviewScreen;