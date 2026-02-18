
import { useState, useEffect } from 'react';

export interface CurrentUser {
  id: string;
  email?: string;
  name: string;
}

const STORAGE_KEY = 'imam_auth_user';
const DEFAULT_USER: CurrentUser = {
  id: 'guest-parent',
  name: 'Parent',
  email: 'family@imam.app'
};

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      // Set default user if none exists
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER));
      setCurrentUser(DEFAULT_USER);
    }
    setLoading(false);
  }, []);

  const login = (name: string, email: string) => {
    const user = { id: 'local-user-' + Date.now(), name, email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = () => {
    // Reset to default instead of clearing
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER));
    setCurrentUser(DEFAULT_USER);
  };

  const updateProfile = (name: string) => {
    if (currentUser) {
      const updated = { ...currentUser, name };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setCurrentUser(updated);
    }
  };

  return { currentUser, loading, login, logout, updateProfile };
};
