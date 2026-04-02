// frontend/src/utils/adminApi.ts
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api") + "/admin";

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Something went wrong");
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Request failed");
  }
  return data;
};

// Dashboard
export async function getDashboardStats() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  
  const res = await fetch(`${API_BASE}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// Users
export async function getAllUsers(page: number = 1, search: string = "") {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  
  const res = await fetch(`${API_BASE}/users?page=${page}&search=${encodeURIComponent(search)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function updateUserRole(userId: string, roleName: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roleName }),
  });
  return handleResponse(res);
}

export async function deleteUserById(userId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// Admin actions (activity log)
export async function getAdminActions(page: number = 1) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/actions?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// Properties
export async function getAllProperties(page: number = 1, status: string = "all") {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  
  const res = await fetch(`${API_BASE}/properties?page=${page}&status=${status}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// Bookings
export async function getAllBookings(page: number = 1, status: string = "all") {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  
  const res = await fetch(`${API_BASE}/bookings?page=${page}&status=${status}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// Approve/Reject Property
export async function approveProperty(propertyId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  
  const res = await fetch(`${API_BASE}/properties/${propertyId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function rejectProperty(propertyId: string, reason?: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  
  const res = await fetch(`${API_BASE}/properties/${propertyId}/reject`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  return handleResponse(res);
}