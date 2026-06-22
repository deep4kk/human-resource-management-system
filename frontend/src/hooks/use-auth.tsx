import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserProfile,
  useGetMe,
  getGetMeQueryKey,
} from "@hrms/api-client";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("hrms_token"),
  );
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
  } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (error) {
      logout();
    }
  }, [error]);

  const login = (newToken: string, userData: UserProfile) => {
    localStorage.setItem("hrms_token", newToken);
    setToken(newToken);
    queryClient.setQueryData(getGetMeQueryKey(), userData);
  };

  const logout = () => {
    localStorage.removeItem("hrms_token");
    setToken(null);
    queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isLoading && !!token,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
