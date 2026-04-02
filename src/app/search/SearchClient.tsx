"use client";

import { useState, useEffect } from "react";
import { searchListings } from "@/lib/api";

export default function SearchClient({ searchParams }: { searchParams: any }) {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const data = await searchListings(searchParams);
        setListings(data);
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError("Failed to load listings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 text-lg">No properties found.</p>
          <p className="text-gray-500 mt-2">Try adjusting your search filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {listings.map((listing: any) => (
        <div key={listing.id} className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
          <img 
            src={listing.image || "/placeholder.png"} 
            alt={listing.title}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
            <p className="text-gray-500 text-sm mb-2">{listing.location}</p>
            <p className="font-bold text-red-600">${listing.price}/night</p>
          </div>
        </div>
      ))}
    </div>
  );
}