// frontend/src/utils/api.ts
// Centralize backend base URL for all API calls.
// In Next.js, NEXT_PUBLIC_* vars are inlined at build time for client components.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// -------------------- AUTH --------------------
export async function registerUser(fullName: string, email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Registration failed");
  }

  const response = await res.json();
  // Handle both response formats (direct or nested under 'data')
  const data = response.data || response;
  
  if (data.token) {
    localStorage.setItem("token", data.token);
  }
  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  
  return data.user;
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Login failed");
  }

  const response = await res.json();
  // Handle both response formats (direct or nested under 'data')
  const data = response.data || response;
  
  if (data.token) {
    localStorage.setItem("token", data.token);
  }
  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
  
  return data.user;
}

// -------------------- PROPERTIES --------------------
export async function createProperty(propertyData: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(propertyData),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create property");
  }

  return await res.json();
}

export async function getProperties() {
  const res = await fetch(`${API_BASE_URL}/properties`);
  if (!res.ok) throw new Error("Failed to fetch properties");
  return await res.json();
}

export async function getPropertyById(id: string) {
  const res = await fetch(`${API_BASE_URL}/properties/${id}`);
  if (!res.ok) throw new Error("Failed to fetch property");
  return await res.json();
}

export async function updateProperty(id: string, updateData: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/properties/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update property");
  }

  return await res.json();
}

export async function deleteProperty(id: string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/properties/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to delete property");
  }

  return await res.json();
}

// -------------------- BOOKINGS --------------------
export async function createBooking(propertyId: string, checkIn: string, checkOut: string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ propertyId, checkIn, checkOut }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Booking failed");
  }

  return await res.json();
}

// -------------------- UPLOAD IMAGES --------------------
export async function uploadPropertyImages(propertyId: string, files: File[]) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const res = await fetch(`${API_BASE_URL}/properties/${propertyId}/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to upload images");
  }

  return await res.json();
}

// ==================== ELIGIBILITY CHECK FUNCTION ====================

export interface EligibilityCheckData {
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface EligibilityResult {
  eligible: boolean;
  message?: string;
  availableDates?: { start: string; end: string }[];
  price?: {
    dailyRate: number;
    nights: number;
    total: number;
  };
}

/**
 * Check if a property is available/eligible for booking on specific dates
 * @param propertyId - The ID of the property
 * @param data - Check-in date, check-out date, and number of guests
 * @returns Eligibility result with price information if available
 */
export async function checkPropertyEligibility(
  propertyId: string, 
  data: EligibilityCheckData
): Promise<EligibilityResult> {
  const token = localStorage.getItem("token");
  
  // Build headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  // Add token if available (for authenticated users)
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/properties/${propertyId}/check-availability`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
      }),
    });

    const responseData = await res.json();

    if (!res.ok) {
      // Return a structured eligibility result instead of throwing
      return {
        eligible: false,
        message: responseData.message || "Property not available for selected dates",
      };
    }

    // Calculate price information if property data is available
    // You might need to fetch property details separately or have the backend return price info
    return {
      eligible: true,
      message: "Property is available!",
      availableDates: responseData.availableDates,
      price: responseData.price, // If your backend returns price info
    };
  } catch (error) {
    console.error("Error checking eligibility:", error);
    return {
      eligible: false,
      message: error instanceof Error ? error.message : "Failed to check availability",
    };
  }
}

// ==================== OPTIONAL: ADDITIONAL HELPER FUNCTIONS ====================

/**
 * Get available dates for a property
 * @param propertyId - The ID of the property
 * @param month - Optional month to check (YYYY-MM format)
 * @returns Array of available date ranges
 */
export async function getPropertyAvailability(propertyId: string, month?: string) {
  const url = month 
    ? `${API_BASE_URL}/properties/${propertyId}/availability?month=${month}`
    : `${API_BASE_URL}/properties/${propertyId}/availability`;
  
  const res = await fetch(url);
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to fetch availability");
  }
  
  return await res.json();
}

/**
 * Calculate total price for a booking
 * @param propertyId - The ID of the property
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @returns Price calculation
 */
export async function calculateBookingPrice(propertyId: string, checkIn: string, checkOut: string) {
  const res = await fetch(
    `${API_BASE_URL}/properties/${propertyId}/calculate-price?checkIn=${checkIn}&checkOut=${checkOut}`
  );
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to calculate price");
  }
  
  return await res.json();
}