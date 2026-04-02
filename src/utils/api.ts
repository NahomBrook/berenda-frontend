// src/utils/api.ts

// HARDCODED for production - Remove after Vercel env vars work
export const API_BASE_URL = "https://berenda-backend-ow7d.onrender.com/api";
// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Helper to extract data from response
function extractData(response: any) {
  if (response.data) {
    return response.data;
  }
  return response;
}

export async function registerUser(fullName: string, email: string, password: string) {
  try {
    const registerRes = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });

    const registerData = await registerRes.json();
    console.log("Register response:", registerData);

    if (!registerRes.ok) {
      throw new Error(registerData.message || "Registration failed");
    }

    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginRes.json();
    console.log("Login response:", loginData);

    if (!loginRes.ok) {
      window.location.href = "/auth/login";
      throw new Error("Registration successful! Please log in.");
    }

    const loginResult = extractData(loginData);
    
    if (loginResult.token) {
      localStorage.setItem("token", loginResult.token);
    }
    if (loginResult.user) {
      localStorage.setItem("user", JSON.stringify(loginResult.user));
      return loginResult.user;
    }
    
    throw new Error("Invalid response format from server");
  } catch (error: any) {
    console.error("Registration error:", error);
    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("Login response:", data);

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    const result = extractData(data);
    
    if (result.token) {
      localStorage.setItem("token", result.token);
    }
    if (result.user) {
      localStorage.setItem("user", JSON.stringify(result.user));
      return result.user;
    }
    
    throw new Error("Invalid response format from server");
  } catch (error: any) {
    console.error("Login error:", error);
    throw error;
  }
}

// -------------------- PROPERTIES --------------------

export async function getProperties() {
  const res = await fetch(`${API_BASE_URL}/properties`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to fetch properties");
  return data;
}

export async function getPropertyById(id: string) {
  const res = await fetch(`${API_BASE_URL}/properties/${id}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to fetch property");
  return data;
}

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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to create property");
  return data;
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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to update property");
  return data;
}

export async function deleteProperty(id: string) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/properties/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to delete property");
  return data;
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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Booking failed");
  return data;
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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to upload images");
  return data;
}

// ==================== ELIGIBILITY CHECK ====================

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

export async function checkPropertyEligibility(
  propertyId: string, 
  data: EligibilityCheckData
): Promise<EligibilityResult> {
  const token = localStorage.getItem("token");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
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
      return {
        eligible: false,
        message: responseData.message || "Property not available for selected dates",
      };
    }

    return {
      eligible: true,
      message: "Property is available!",
      availableDates: responseData.availableDates,
      price: responseData.price,
    };
  } catch (error) {
    console.error("Error checking eligibility:", error);
    return {
      eligible: false,
      message: error instanceof Error ? error.message : "Failed to check availability",
    };
  }
}

// ==================== ADDITIONAL HELPERS ====================

export async function getPropertyAvailability(propertyId: string, month?: string) {
  const url = month 
    ? `${API_BASE_URL}/properties/${propertyId}/availability?month=${month}`
    : `${API_BASE_URL}/properties/${propertyId}/availability`;
  
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch availability");
  }
  
  return data;
}

export async function calculateBookingPrice(propertyId: string, checkIn: string, checkOut: string) {
  const res = await fetch(
    `${API_BASE_URL}/properties/${propertyId}/calculate-price?checkIn=${checkIn}&checkOut=${checkOut}`
  );
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.message || "Failed to calculate price");
  }
  
  return data;
}
