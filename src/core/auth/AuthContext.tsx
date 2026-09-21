import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'customer' | 'hub_staff' | 'hub_manager' | 'tailor' | 'rider' | 'admin' | null;

interface AuthState {
  isAuthenticated: boolean;
  role: Role;
  userId: string | null;
  userName: string | null;
  hubId: string | null;
}

interface AuthContextType extends AuthState {
  login: (role: Role, userId: string, userName: string, hubId?: string) => void;
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

  const login = (role: Role, userId: string, userName: string, hubId?: string) => {
    setState({ isAuthenticated: true, role, userId, userName, hubId: hubId || 'h1' });
  };

  const logout = () => {
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
