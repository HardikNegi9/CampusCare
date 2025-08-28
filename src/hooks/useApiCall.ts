import { useAuth } from '@/providers/AuthProvider';

export const useApiCall = () => {
  const { logout } = useAuth();

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    try {
      const response = await fetch(url, config);
      
      // If token is invalid, logout user
      if (response.status === 401) {
        await logout();
        throw new Error('Authentication failed');
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  return { apiCall };
};
