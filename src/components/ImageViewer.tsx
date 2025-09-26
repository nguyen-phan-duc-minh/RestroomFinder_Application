import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface ImageViewerProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [scale] = useState(new Animated.Value(1));

  const pinchResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: () => {
      scale.setOffset((scale as any)._value);
      scale.setValue(0);
    },
    onPanResponderMove: Animated.event(
      [null, { dy: scale }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: () => {
      scale.flattenOffset();
    },
  });

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIdx = Math.round(contentOffset / width);
    setCurrentIndex(currentIdx);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  React.useEffect(() => {
    if (initialIndex !== undefined) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.imageCounter}>
            {currentIndex + 1} / {images.length}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Image ScrollView */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          contentOffset={{ x: currentIndex * width, y: 0 }}
          style={styles.scrollView}
        >
          {images.map((imageUrl, index) => (
            <View key={index} style={styles.imageContainer}>
              <ScrollView
                maximumZoomScale={3}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                style={styles.zoomScrollView}
                contentContainerStyle={styles.zoomContent}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </ScrollView>
            </View>
          ))}
        </ScrollView>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.leftButton]}
                onPress={goToPrevious}
              >
                <Ionicons name="chevron-back" size={32} color="white" />
              </TouchableOpacity>
            )}
            
            {currentIndex < images.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.rightButton]}
                onPress={goToNext}
              >
                <Ionicons name="chevron-forward" size={32} color="white" />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Bottom Dots Indicator */}
        {images.length > 1 && (
          <View style={styles.dotsContainer}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex ? styles.activeDot : styles.inactiveDot,
                ]}
                onPress={() => setCurrentIndex(index)}
              />
            ))}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    padding: 5,
  },
  imageCounter: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 38, // Same width as close button for centering
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width - 40,
    height: height - 200,
    maxHeight: height * 0.8,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftButton: {
    left: 20,
  },
  rightButton: {
    right: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#00bf63',
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  zoomScrollView: {
    flex: 1,
  },
  zoomContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ImageViewer;
