// Server component — fetches properties at request time and passes to client
import { Suspense } from "react";
import HomeClient from "./HomeClient";
import type { Property } from "@/types/property";

// ISR: revalidate cached data every 60 seconds
export const revalidate = 60;

async function fetchInitialProperties(): Promise<Property[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://berenda-backend-ow7d.onrender.com/api';
    const res = await fetch(`${apiUrl}/properties?limit=20`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const initialProperties = await fetchInitialProperties();

  return (
    <Suspense fallback={null}>
      <HomeClient initialProperties={initialProperties} />
    </Suspense>
  );
}
