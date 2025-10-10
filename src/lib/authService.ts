const API_BASE_URL = 'https://luccibyey.com.tn/production/api/auth.php';

export interface User {
  id: number;
  nom: string;
  email: string;
  role: string;
  user_type?: string;
  active?: number;
  created_at?: string;
  updated_at?: string;
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

class AuthService {
  private getAuthHeader() {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      
      if (data.success && data.user && data.token) {
        // Store user and token in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('auth_token', data.token);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Erreur de connexion au serveur',
      };
    }
  }

  async register(nom: string, email: string, password: string, role: string = 'production'): Promise<AuthResponse> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
        body: JSON.stringify({
          action: 'register',
          nom,
          email,
          password,
          role,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      
      if (data.success && data.user && data.token) {
        // Store user and token in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('auth_token', data.token);
      }

      return data;
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: 'Erreur de connexion au serveur',
      };
    }
  }

  async verifyToken(): Promise<AuthResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return { success: false, message: 'Aucun token trouvé' };
    }

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          token,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      
      if (data.success && data.user) {
        // Update user in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        message: 'Erreur de vérification du token',
      };
    }
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        this.logout();
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token') && !!this.getCurrentUser();
  }
}

export const authService = new AuthService();