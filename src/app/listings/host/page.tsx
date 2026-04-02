// frontend/src/app/listings/host/page.tsx
"use client";

import dynamic from "next/dynamic";

// Dynamically import the host page component with SSR disabled
const HostPropertyPage = dynamic(
  () => import("@/app/properties/host/page"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }
);

export default function ListingsHostPage() {
  return <HostPropertyPage />;
}