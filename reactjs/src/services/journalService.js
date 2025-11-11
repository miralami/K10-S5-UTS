import { format } from 'date-fns';

const API_BASE_URL = 'http://localhost:8000/api';

function getAuthToken() {
  return localStorage.getItem('token');
}

const requestDefaults = {
  mode: 'cors',
  credentials: 'include', // This is required for cookies, authorization headers with CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    // Note: don't set Authorization here at module load — read token dynamically per-request
  },
};

function buildRequestOptions(options = {}) {
  const token = getAuthToken();
  return {
    ...requestDefaults,
    ...options,
    headers: {
      ...requestDefaults.headers,
      ...(options.headers ?? {}),
      // Inject the latest token from localStorage at request time
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

function safeToISOString(date) {
  try {
    if (!date) return null;
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string' || typeof date === 'number') return new Date(date).toISOString();
    return null;
  } catch (e) {
    console.warn('Error converting date to ISO string:', e);
    return null;
  }
}

function processDates(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Create a deep copy to avoid modifying the original
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in result) {
    if (result.hasOwnProperty(key)) {
      // Handle date fields
      if (key.endsWith('_at') || key.endsWith('At') || key.endsWith('_date') || key === 'date' || key === 'created' || key === 'updated') {
        result[key] = safeToISOString(result[key]);
      } else if (typeof result[key] === 'object') {
        result[key] = processDates(result[key]);
      }
    }
  }
  
  return result;
}

async function handleResponse(response) {
  // First, get the response text to check if it's a PHP error
  const responseText = await response.text();
  
  // Check if the response looks like a PHP error
  if (responseText.includes('Fatal error') || 
      responseText.includes('toIso8601String() on null') || 
      responseText.includes('Call to a member function')) {
    console.warn('Server-side error detected:', responseText.substring(0, 200)); // Log first 200 chars
    return { 
      status: 'error', 
      message: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
      _isError: true
    };
  }
  
  // Handle 401 Unauthorized
  if (response.status === 401) {
    // You might want to redirect to login or refresh token here
    console.warn('Unauthorized access - redirecting to login');
    window.location.href = '/login';
    return { _isError: true, status: 'error', message: 'Sesi telah berakhir. Silakan login kembali.' };
  }
  
  if (!response.ok) {
    let message;
    try {
      // Try to parse as JSON for structured error messages
      const errorData = JSON.parse(responseText);
      message = errorData.message || errorData.error || `Permintaan gagal dengan status ${response.status}`;
    } catch {
      // If not JSON, use the raw text or default message
      message = responseText || `Permintaan gagal dengan status ${response.status}`;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  try {
    // If we got here, the response should be valid JSON
    const data = JSON.parse(responseText);
    return processDates(data);
  } catch (error) {
    console.warn('Error parsing JSON response:', error);
    return { 
      status: 'error', 
      message: 'Gagal memproses respons dari server',
      _isError: true
    };
  }
}

async function extractErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload?.message || payload?.error;
  } catch (error) {
    return null;
  }
}

export async function getWeeklySummary({ weekEnding, startDate, endDate, userId } = {}) {
  const params = new URLSearchParams();

  try {
    if (weekEnding) {
      params.append('week_ending', weekEnding);
    } else if (startDate && endDate) {
      // Ensure dates are valid Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Tanggal tidak valid');
      }
      
      params.append('start_date', format(start, 'yyyy-MM-dd'));
      params.append('end_date', format(end, 'yyyy-MM-dd'));
    }

    if (userId) {
      params.append('user_id', userId);
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/journal/weekly-summary${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, buildRequestOptions());
    
    try {
      const payload = await handleResponse(response);
      
      // If handleResponse detected an error, return it
      if (payload?._isError) {
        return payload;
      }
      
      if (payload?.status === 'pending') {
        payload.message = payload.message || 'Ringkasan mingguan belum tersedia.';
      }
      
      // Ensure we have valid data structure
      if (!payload) {
        console.warn('Empty response from weekly-summary endpoint');
        return { status: 'error', message: 'Tidak ada data yang diterima dari server' };
      }
      
      return payload;
    } catch (error) {
      console.error('Error in getWeeklySummary response handling:', error);
      return { 
        status: 'error',
        message: error.message || 'Gagal memuat ringkasan mingguan'
      };
    }
  } catch (error) {
    console.error('Error in getWeeklySummary:', error);
    return { 
      status: 'error', 
      message: error.message || 'Gagal memuat ringkasan mingguan' 
    };
  }
}

export async function getDailySummary({ date, userId } = {}) {
  const params = new URLSearchParams();

  try {
    if (date) {
      // Ensure date is a valid Date object
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Format tanggal tidak valid');
      }
      params.append('date', format(dateObj, 'yyyy-MM-dd'));
    }

    if (userId) {
      params.append('user_id', userId);
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/journal/daily-summary${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, buildRequestOptions());
    
    try {
      const payload = await handleResponse(response);
      
      // If handleResponse detected an error, return it
      if (payload?._isError) {
        return payload;
      }
      
      if (payload?.status === 'pending') {
        payload.message = payload.message || 'Ringkasan harian belum tersedia.';
      }
      
      // Ensure we have valid data structure
      if (!payload) {
        console.warn('Empty response from daily-summary endpoint');
        return { status: 'error', message: 'Tidak ada data yang diterima dari server' };
      }
      
      return payload;
    } catch (error) {
      console.error('Error in getDailySummary response handling:', error);
      return { 
        status: 'error',
        message: error.message || 'Gagal memuat ringkasan harian'
      };
    }
  } catch (error) {
    console.error('Error in getDailySummary:', error);
    return { 
      status: 'error', 
      message: error.message || 'Gagal memuat ringkasan harian' 
    };
  }
}

export async function listNotes({ userId, startDate, endDate } = {}) {
  const params = new URLSearchParams();

  if (userId) {
    params.append('user_id', userId);
  }
  
  if (startDate) {
    const start = new Date(startDate);
    if (!isNaN(start.getTime())) {
      params.append('start_date', format(start, 'yyyy-MM-dd'));
    }
  }
  
  if (endDate) {
    const end = new Date(endDate);
    if (!isNaN(end.getTime())) {
      params.append('end_date', format(end, 'yyyy-MM-dd'));
    }
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/journal/notes${params.toString() ? `?${params}` : ''}`,
      buildRequestOptions({ method: 'GET' })
    );

    const result = await handleResponse(response);
    // Ensure we always return an array
    return Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];
  } catch (error) {
    console.error('Error in listNotes:', error);
    return [];
  }
}

export async function createNote({ userId, title, body }) {
  try {
    const now = new Date();
    const response = await fetch(
      `${API_BASE_URL}/journal/notes`,
      buildRequestOptions({
        method: 'POST',
        body: JSON.stringify({
          user_id: userId || null,
          title: title || null,
          body,
          // Add server-side timestamps if needed
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        }),
      })
    );

    const payload = await handleResponse(response);
    
    // The response is already processed by handleResponse
    return payload?.data || payload;
  } catch (error) {
    console.error('Error in createNote:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function updateNote(id, { userId, title, body }) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/journal/notes/${id}`,
      buildRequestOptions({
        method: 'PATCH',
        body: JSON.stringify({
          user_id: userId,
          title,
          body,
          // Add server-side timestamp if needed
          updated_at: new Date().toISOString(),
        }),
      })
    );

    const payload = await handleResponse(response);
    
    // The response is already processed by handleResponse
    return payload?.data || payload;
  } catch (error) {
    console.error('Error in updateNote:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function deleteNote(id) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/journal/notes/${id}`,
      buildRequestOptions({ method: 'DELETE' })
    );

    await handleResponse(response);
    return true; // Indicate success
  } catch (error) {
    console.error('Error in deleteNote:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function generateWeeklyForCurrentUser({ startDate, endDate, weekEnding } = {}) {
  try {
    const body = {};
    if (startDate) body.start_date = startDate;
    if (endDate) body.end_date = endDate;
    if (weekEnding) body.week_ending = weekEnding;

    const response = await fetch(
      `${API_BASE_URL}/journal/generate-weekly`,
      buildRequestOptions({ method: 'POST', body: JSON.stringify(body) })
    );

    const payload = await handleResponse(response);
    return payload;
  } catch (error) {
    console.error('Error in generateWeeklyForCurrentUser:', error);
    throw error;
  }
}
