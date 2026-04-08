// profileApi.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const getProfile = async (token: string) => {
  const res = await fetch(`${API_BASE}/users/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

// Single PUT call — backend route is PUT /users/profile with multer("avatar")
export const updateProfile = async (data: any, token: string, imageFile?: File) => {
  const formData = new FormData();
  if (data.fullName) formData.append("fullName", data.fullName);
  if (data.phone) formData.append("phone", data.phone);
  if (imageFile) formData.append("avatar", imageFile);

  const res = await fetch(`${API_BASE}/users/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type — browser sets it with the correct boundary for multipart
    },
    body: formData,
  });
  return res.json();
};

export const getUserBookings = async (token: string) => {
  const res = await fetch(`${API_BASE}/bookings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const getFavorites = async (token: string) => {
  const res = await fetch(`${API_BASE}/favorites`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

// Add these missing functions
export const getUserProperties = async (token: string) => {
  const res = await fetch(`${API_BASE}/properties/user/properties`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const getSettings = async (token: string) => {
  const res = await fetch(`${API_BASE}/users/settings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const updateUserSettings = async (settings: any, token: string) => {
  const res = await fetch(`${API_BASE}/users/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });
  return res.json();
};