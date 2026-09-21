import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ApiClient } from '../../infrastructure/api/ApiClient';

type Role = 'customer' | 'hub_staff' | 'hub_manager' | 'tailor' | 'rider' | 'admin' | 'super_admin' | null;

interface AuthState {
  isAuthenticated: boolean;
  role: Role;
  userId: string | null;
  userName: string | null;
  hubId: string | null;
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password?: string) => Promise<void>;
  logout: () => void;
  setHubId: (hubId: string) => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    userId: null,
    userName: null,
    hubId: null,
  });

  useEffect(() => {
    // Check for existing token on mount
    const loadSession = async () => {
      const token = await ApiClient.getToken();
      if (token) {
        try {
          const user = await ApiClient.getMe();
          setState({
            isAuthenticated: true,
            role: user.role?.toLowerCase() as Role,
            userId: user.id || user.user_id,
            userName: user.name || user.phone,
            hubId: user.hubId || 'h1'
          });
        } catch (e) {
          // Token invalid or expired
          await ApiClient.clearToken();
        }
      }
    };
    loadSession();
  }, []);

  const login = async (identifier: string, password = 'test') => {
    const data = await ApiClient.login(identifier, password);
    // Fetch profile
    const user = await ApiClient.getMe();
    setState({ 
      isAuthenticated: true, 
      role: user.role?.toLowerCase() as Role || 'customer', 
      userId: user.id || user.user_id, 
      userName: user.name || user.phone || user.email, 
      hubId: user.hubId || 'h1' 
    });
  };

  const logout = async () => {
    await ApiClient.clearToken();
    setState({ isAuthenticated: false, role: null, userId: null, userName: null, hubId: null });
  };

  const setHubId = (hubId: string) => {
    setState(prev => ({ ...prev, hubId }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setHubId }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
