import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  name?: string;
  role?: 'user' | 'owner';
  is_random_user?: boolean;
  currentRestroomId?: number;
  isUsing: boolean;
  startTime?: Date;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  generateRandomUser: () => Promise<User>;
  login: (username: string, password: string) => Promise<{success: boolean, role?: 'user' | 'owner'}>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const generateRandomName = (): string => {
  const adjectives = ['Happy', 'Lucky', 'Brave', 'Smart', 'Kind', 'Cool', 'Swift', 'Bright'];
  const nouns = ['Lion', 'Eagle', 'Tiger', 'Bear', 'Wolf', 'Fox', 'Hawk', 'Deer'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}${noun}${number}`;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const generateRandomUser = async (): Promise<User> => {
    const username = generateRandomName();
    
    try {
      const response = await fetch('http://10.10.123.5:5002/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      if (response.ok) {
        const userData = await response.json();
        const newUser: User = {
          id: userData.id,
          username: userData.username,
          isUsing: false,
        };
        setUser(newUser);
        return newUser;
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      // Fallback for offline mode
      const fallbackUser: User = {
        id: Math.floor(Math.random() * 10000),
        username,
        isUsing: false,
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  const login = async (username: string, password: string): Promise<{success: boolean, role?: 'user' | 'owner'}> => {
    try {
      const response = await api.login(username, password);
      if (response.success && response.user) {
        const newUser: User = {
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          phone: response.user.phone,
          name: response.user.name,
          role: response.user.role,
          is_random_user: response.user.is_random_user,
          isUsing: false,
        };
        setUser(newUser);
        return { success: true, role: response.user.role };
      }
      return { success: false };
    } catch (error) {
      console.error('Login error in context:', error);
      return { success: false };
    }
  };

  const logout = () => {
    setUser(null);
    // Don't auto-generate random user, let user choose role again
  };

  useEffect(() => {
    // Don't auto-generate random user anymore
    // Let user choose their role first
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, generateRandomUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};