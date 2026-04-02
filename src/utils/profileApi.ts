const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const getProfile = async (token: string) => {
  const res = await fetch(`${API_BASE}/users/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const updateProfile = async (data: any, token: string) => {
  const res = await fetch(`${API_BASE}/users/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const uploadProfileImage = async (file: File, token: string) => {
  const formData = new FormData();
  formData.append("profileImage", file);

  const res = await fetch(`${API_BASE}/users/profile/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return res.json();
};