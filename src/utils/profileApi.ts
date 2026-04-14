// profileApi.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function handleAuthError(res: Response): void {
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("berenda_token");
    localStorage.removeItem("berenda_user");
    window.location.href = "/auth/login";
  }
}

async function authedFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);
  handleAuthError(res);
  return res.json();
}

export const getProfile = (token: string) =>
  authedFetch(`${API_BASE}/users/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Single PUT call — backend route is PUT /users/profile with multer("avatar")
export const updateProfile = async (data: any, token: string, imageFile?: File) => {
  const formData = new FormData();
  if (data.fullName) formData.append("fullName", data.fullName);
  if (data.phone) formData.append("phone", data.phone);
  if (imageFile) formData.append("avatar", imageFile);

  return authedFetch(`${API_BASE}/users/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type — browser sets it with the correct boundary for multipart
    },
    body: formData,
  });
};

export const getUserBookings = (token: string) =>
  authedFetch(`${API_BASE}/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getFavorites = (token: string) =>
  authedFetch(`${API_BASE}/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getHostBookings = (token: string) =>
  authedFetch(`${API_BASE}/bookings/host`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateBookingStatus = (token: string, bookingId: string, status: string) =>
  authedFetch(`${API_BASE}/bookings/${bookingId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

export const getUserProperties = (token: string) =>
  authedFetch(`${API_BASE}/properties/user/properties`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getSettings = (token: string) =>
  authedFetch(`${API_BASE}/users/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateUserSettings = (settings: any, token: string) =>
  authedFetch(`${API_BASE}/users/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });
