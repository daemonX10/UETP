// Types for authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  token?: string;
}

export interface GoogleAuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
  token?: string;
}

// Auth service class
class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Simulate API call - replace with actual backend call
      await this.delay(1500); // Simulate network delay
      
      // Validate credentials (this would be done on the backend)
      if (credentials.email === 'demo@uetp.com' && credentials.password === 'demo123') {
        const response: AuthResponse = {
          success: true,
          message: 'Login successful',
          user: {
            id: '1',
            email: credentials.email,
            name: 'Demo User'
          },
          token: 'demo-jwt-token-12345'
        };
        
        // Store token in localStorage (in production, use httpOnly cookies)
        localStorage.setItem('authToken', response.token!);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return response;
      } else {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      await this.delay(1500);
      
      // Simulate registration
      const response: AuthResponse = {
        success: true,
        message: 'Registration successful',
        user: {
          id: Math.random().toString(36).substr(2, 9),
          email: credentials.email,
          name: credentials.name
        },
        token: 'new-jwt-token-' + Math.random().toString(36).substr(2, 9)
      };
      
      localStorage.setItem('authToken', response.token!);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response;
    } catch (error) {
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  async googleLogin(): Promise<GoogleAuthResponse> {
    try {
      await this.delay(1500);
      
      // Simulate Google OAuth
      const response: GoogleAuthResponse = {
        success: true,
        message: 'Google login successful',
        user: {
          id: 'google-' + Math.random().toString(36).substr(2, 9),
          email: 'user@gmail.com',
          name: 'Google User',
          picture: 'https://via.placeholder.com/40'
        },
        token: 'google-jwt-token-' + Math.random().toString(36).substr(2, 9)
      };
      
      localStorage.setItem('authToken', response.token!);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response;
    } catch (error) {
      return {
        success: false,
        message: 'Google login failed. Please try again.'
      };
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const authService = new AuthService();
