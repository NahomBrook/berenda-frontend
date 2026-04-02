// frontend/src/services/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🌐 Fetching:', url);
    
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();
      console.log('📦 Raw response:', data);

      if (!response.ok) {
        throw new Error(data.message || `API request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  async getProperties(filters?: {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    checkIn?: string;
    checkOut?: string;
    homeType?: string[];
    amenities?: string[];
    bedrooms?: number;
  }) {
    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters?.location) params.append('location', filters.location);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.checkIn) params.append('checkIn', filters.checkIn);
      if (filters?.checkOut) params.append('checkOut', filters.checkOut);
      if (filters?.bedrooms && filters.bedrooms > 0) params.append('bedrooms', filters.bedrooms.toString());
      if (filters?.homeType?.length) params.append('homeType', filters.homeType.join(','));
      if (filters?.amenities?.length) params.append('amenities', filters.amenities.join(','));

      const queryString = params.toString();
      const endpoint = `/properties${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.fetch<any>(endpoint);
      
      // Handle your backend's response structure
      if (response.success && Array.isArray(response.data)) {
        console.log(`✅ Successfully fetched ${response.count} properties`);
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      } else if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('⚠️ Unexpected API response format:', response);
        return [];
      }
    } catch (error) {
      console.error('❌ Error in getProperties:', error);
      throw error;
    }
  }

  async searchLocations(query: string) {
    try {
      const response = await this.fetch<any>(`/locations/search?q=${encodeURIComponent(query)}`);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  }

  async getProperty(id: string) {
    const response = await this.fetch<any>(`/properties/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    return response;
  }

  async createProperty(propertyData: any) {
    const response = await this.fetch<any>('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
    return response.data;
  }

  async updateProperty(id: string, propertyData: any) {
    const response = await this.fetch<any>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
    return response.data;
  }

  async deleteProperty(id: string) {
    const response = await this.fetch<any>(`/properties/${id}`, {
      method: 'DELETE',
    });
    return response;
  }
}

export const api = new ApiService();