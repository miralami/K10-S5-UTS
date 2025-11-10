const API_BASE_URL = 'http://localhost:8000/api';

const requestDefaults = {
  mode: 'cors',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
};

export async function login({ email, password }) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      ...requestDefaults,
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data.status === 'error') {
      console.error('Login error response:', data);
      throw new Error(data.message || 'Login gagal');
    }

    // Save auth data
    const { access_token, user } = data.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));

    return data;
  } catch (error) {
    console.error('Login error:', error);
    // Make sure to clean up any partially stored auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
  }
}

export async function register({ name, email, password, password_confirmation }) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      ...requestDefaults,
      method: 'POST',
      body: JSON.stringify({ name, email, password, password_confirmation }),
    });

    const data = await response.json();
    if (data.status === 'error') {
      console.error('Register error response:', data);
      throw new Error(data.message || 'Registrasi gagal');
    }

    // Save auth data
    const { access_token, user } = data.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));

    return data;
  } catch (error) {
    console.error('Register error:', error);
    // Make sure to clean up any partially stored auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
  }
}

export async function logout() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      ...requestDefaults,
      method: 'POST',
      headers: {
        ...requestDefaults.headers,
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    // Always clean up local storage regardless of success
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (data.status === 'error') {
      console.error('Logout error response:', data);
      throw new Error(data.message || 'Logout gagal');
    }

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    // Error already logged, just rethrow
    throw error;
  }
}

export function getAuthUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function getAuthToken() {
  return localStorage.getItem('token');
}

export function isAuthenticated() {
  return !!getAuthToken();
}