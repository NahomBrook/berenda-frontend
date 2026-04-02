"use client";

import { useRouter } from "next/navigation";

export default function ListingsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Listings</h1>
        <p className="text-gray-600 mb-6">
          Browse properties from the home page search.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 transition"
        >
          Go to Home
        </button>
      </div>
    </main>
  );
}