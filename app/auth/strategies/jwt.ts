// app/auth/strategies/jwt.ts
import { authService } from "../../../services/authService";
import { AuthStrategy } from "./base"
import { TokenPayload, User } from "../../../types";

export class JWTStrategy implements AuthStrategy {
  private token: string | null = null;
  private tokenPayload: TokenPayload | null = null;
  private readonly accessTokenKeys = ["accessToken", "access_token", "token", "jwt"] as const;
  private readonly refreshTokenKeys = ["refreshToken", "refresh_token"] as const;
  
  // Helper method to decode JWT token
  private decodeToken(token: string): TokenPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token', error);
      throw new Error('Invalid token format');
    }
  }
  
  async login(credentials: { email: string; password: string }) {
    try {
      const data = await authService.login(credentials);
      this.token = data.access_token ?? data.access ?? null;
      const refreshToken = data.refresh_token ?? data.refresh ?? null;

      // Decode and store the token payload
      if (this.token) {
        this.tokenPayload = this.decodeToken(this.token);
      }
      const user:User = {
        id: this.tokenPayload!.user_id,
        email: this.tokenPayload!.email,
        name: this.tokenPayload!.name,
        role: this.tokenPayload!.role,
      }
      this.setAccessToken(this.token!);
      if (refreshToken) {
        this.setRefreshToken(refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(user));
      return data;
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  isTokenExpired(): boolean {
    if (!this.tokenPayload) return true;
    
    // Check if token is expired (exp is in seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= this.tokenPayload.exp;
  };

  async getUser() {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;
  }

  async getAccessToken() {
    if (typeof window === "undefined") {
      return null;
    }
    const accessToken = this.getStoredAccessToken();
    if (accessToken) {
      this.token = accessToken;
      this.tokenPayload = this.decodeToken(accessToken);
      if (!this.isTokenExpired()) {
        return accessToken;
      }
    }

    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const data = await authService.refresh(refreshToken);
      const nextAccessToken = data.access_token ?? data.access ?? null;
      if (!nextAccessToken) {
        return null;
      }
      this.token = nextAccessToken;
      this.tokenPayload = this.decodeToken(nextAccessToken);
      this.setAccessToken(nextAccessToken);
      return nextAccessToken;
    } catch (error) {
      this.clearStoredTokens();
      localStorage.removeItem("user");
      this.token = null;
      this.tokenPayload = null;
      return null;
    }
  }

  async logout() {
    if (typeof window === "undefined") {
      this.token = null;
      this.tokenPayload = null;
      return;
    }
    // hapus token dari localStorage
    this.clearStoredTokens();
    localStorage.removeItem("user");
    // setuser menjadi null
    this.token = null;
    this.tokenPayload = null;
    // redirect ke login
  }

  private getStoredAccessToken(): string | null {
    for (const key of this.accessTokenKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        return value;
      }
    }
    return null;
  }

  private getStoredRefreshToken(): string | null {
    for (const key of this.refreshTokenKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        return value;
      }
    }
    return null;
  }

  private setAccessToken(token: string) {
    for (const key of this.accessTokenKeys) {
      localStorage.setItem(key, token);
    }
  }

  private setRefreshToken(token: string) {
    for (const key of this.refreshTokenKeys) {
      localStorage.setItem(key, token);
    }
  }

  private clearStoredTokens() {
    for (const key of this.accessTokenKeys) {
      localStorage.removeItem(key);
    }
    for (const key of this.refreshTokenKeys) {
      localStorage.removeItem(key);
    }
  }
}
