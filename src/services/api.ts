import { Restroom, RestroomDetail, ChatMessage } from '../types';

const API_BASE_URL = 'http://10.10.123.5:5002/api';

export const api = {
  // Restrooms
  getRestrooms: async (): Promise<Restroom[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/restrooms`);
      if (!response.ok) throw new Error('Failed to fetch restrooms');
      return await response.json();
    } catch (error) {
      console.error('Error fetching restrooms:', error);
      return [];
    }
  },

  getRestroomDetail: async (id: number): Promise<RestroomDetail | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/restrooms/${id}`);
      if (!response.ok) throw new Error('Failed to fetch restroom detail');
      return await response.json();
    } catch (error) {
      console.error('Error fetching restroom detail:', error);
      return null;
    }
  },

  // User actions
  startUsingRestroom: async (userId: number, restroomId: number): Promise<{ success: boolean; requiresPayment?: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/start-using/${restroomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 402) {
        // Payment required
        const errorData = await response.json();

        return { success: false, requiresPayment: true, error: errorData.error };
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        return { success: false, error: errorText };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Network error starting restroom usage:', error);
      return { success: false, error: 'Network error' };
    }
  },

  stopUsingRestroom: async (userId: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/stop-using`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error stopping restroom usage:', error);
      return false;
    }
  },

  // Reviews
  createReview: async (review: {
    restroom_id: number;
    user_id: number;
    rating: number;
    comment?: string;
    image_path?: string;
  }): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(review),
      });
      return response.ok;
    } catch (error) {
      console.error('Error creating review:', error);
      return false;
    }
  },

  // Chat
  sendMessage: async (message: {
    restroom_id: number;
    user_id: number;
    message: string;
    message_type?: 'normal' | 'sos' | 'paper_request';
    is_from_admin?: boolean;
  }): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      return response.ok;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  },

  getMessages: async (restroomId: number): Promise<ChatMessage[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages/${restroomId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  // Navigation
  requestNavigation: async (restroomId: number, userId?: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/restrooms/${restroomId}/navigation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error requesting navigation:', error);
      return false;
    }
  },

  notifyArrival: async (restroomId: number, userId?: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/restrooms/${restroomId}/arrival`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error notifying arrival:', error);
      return false;
    }
  },

  // Authentication
  register: async (username: string, password: string, role?: 'user' | 'owner'): Promise<{success: boolean, user?: any, error?: string}> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });
      
      if (response.ok) {
        const user = await response.json();
        return { success: true, user };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('Error registering:', error);
      return { success: false, error: 'Network error' };
    }
  },

  login: async (username: string, password: string): Promise<{success: boolean, user?: any, error?: string}> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        const user = await response.json();
        return { success: true, user };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('Error logging in:', error);
      return { success: false, error: 'Network error' };
    }
  },

  checkUsername: async (username: string): Promise<{exists: boolean}> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-username/${encodeURIComponent(username)}`);
      if (response.ok) {
        return await response.json();
      }
      return { exists: false };
    } catch (error) {
      console.error('Error checking username:', error);
      return { exists: false };
    }
  },

  // User history
  getUserHistory: async (userId: number): Promise<{usage_history: any[], reviews: any[]} | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/history`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user history:', error);
      return null;
    }
  },

  // Owner operations
  createRestroom: async (restroomData: any): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/owner/restrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restroomData),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error creating restroom:', error);
      return false;
    }
  },

  updateRestroom: async (restroomId: number, restroomData: any): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/owner/restrooms/${restroomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restroomData),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating restroom:', error);
      return false;
    }
  },

  registerOwner: async (ownerData: any): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/owner/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ownerData),
      });
      return response.ok;
    } catch (error) {
      console.error('Error registering owner:', error);
      return false;
    }
  },

  getOwnerRestrooms: async (ownerId: number): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/owner/${ownerId}/restrooms`);
      if (!response.ok) throw new Error('Failed to fetch owner restrooms');
      return await response.json();
    } catch (error) {
      console.error('Error fetching owner restrooms:', error);
      return [];
    }
  },

  getOwnerRestroomsByEmail: async (email: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/owner/${email}/restrooms`);
      if (!response.ok) throw new Error('Failed to fetch owner restrooms');
      return await response.json();
    } catch (error) {
      console.error('Error fetching owner restrooms:', error);
      return [];
    }
  },

  getOwnerNotifications: async (email: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/owner/${email}/notifications`);
      if (!response.ok) throw new Error('Failed to fetch owner notifications');
      return await response.json();
    } catch (error) {
      console.error('Error fetching owner notifications:', error);
      return [];
    }
  },

  notifyOwner: async (restroomId: number, userId: number, type: string, message: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/restrooms/${restroomId}/notify-owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, type, message }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error notifying owner:', error);
      return false;
    }
  },

  markNotificationRead: async (notificationId: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/owner/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  // Payment APIs
  createPayment: async (paymentData: {
    user_id: number;
    restroom_id: number;
    method: 'cash' | 'transfer';
    amount: number;
    transfer_image_path?: string;
    note?: string;
  }): Promise<{ success: boolean; payment_id?: number; status?: string; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to create payment' };
      }
      return result;
    } catch (error) {
      console.error('Error creating payment:', error);
      return { success: false, error: 'Network error' };
    }
  },

  confirmPayment: async (paymentId: number, action: 'confirm' | 'reject'): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error confirming payment:', error);
      return false;
    }
  },

  getOwnerPayments: async (ownerId: number): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/owner/${ownerId}/payments`);
      if (!response.ok) throw new Error('Failed to fetch owner payments');
      return await response.json();
    } catch (error) {
      console.error('Error fetching owner payments:', error);
      return [];
    }
  },

  getUserPayments: async (userId: number): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/payments`);
      if (!response.ok) throw new Error('Failed to fetch user payments');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user payments:', error);
      return [];
    }
  },

  checkPaymentStatus: async (userId: number, restroomId: number): Promise<{
    payment_confirmed: boolean;
    has_pending_payment?: boolean;
    payment_id?: number;
    pending_payment_id?: number;
    confirmed_at?: string;
  } | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/payment-status/${restroomId}`);
      if (!response.ok) throw new Error('Failed to check payment status');
      return await response.json();
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  },
};

// Helper function to calculate distance between two coordinates

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return Math.round(R * c); // Distance in meters
};