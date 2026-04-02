const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function searchListings(params: {
  location?: string;
  checkIn?: string;
  checkOut?: string;
}) {

  const queryParams = new URLSearchParams();

  if (params.location) queryParams.append("location", params.location);
  if (params.checkIn) queryParams.append("checkIn", params.checkIn);
  if (params.checkOut) queryParams.append("checkOut", params.checkOut);

  const res = await fetch(
    `${API_BASE}/properties/search?${queryParams.toString()}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch listings");
  }

  return res.json();
}