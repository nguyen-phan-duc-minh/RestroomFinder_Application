export interface Restroom {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  is_free: boolean;
  price: number;
  current_users: number;
  rating: number;
  total_reviews: number;
  admin_contact: string;
  image_url: string;
  images?: string[]; // Array of uploaded image URLs from owner
  distance?: number; // calculated on frontend
  // Toilet facilities
  male_standing?: number;
  male_sitting?: number;
  female_sitting?: number;
  disabled_access?: boolean;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  image_path?: string;
  created_at: string;
}

export interface RestroomDetail extends Restroom {
  reviews: Review[];
}

export interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  message_type: 'normal' | 'sos' | 'paper_request';
  is_from_admin: boolean;
  created_at: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}