// frontend/src/app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import Navbar from "@/components/layout/NavBar";
import SearchBar from "@/components/home/SearchBar";
import { api } from "@/services/api";
import type { Property } from "@/types/property";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [showSearchInNav, setShowSearchInNav] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    location: searchParams.get('location') || "",
    checkIn: searchParams.get('checkIn') ? new Date(searchParams.get('checkIn')!) : null,
    checkOut: searchParams.get('checkOut') ? new Date(searchParams.get('checkOut')!) : null,
    homeType: searchParams.get('homeType')?.split(',') || [],
    amenities: searchParams.get('amenities')?.split(',') || [],
    minPrice: parseInt(searchParams.get('minPrice') || '0'),
    maxPrice: parseInt(searchParams.get('maxPrice') || '5000'),
    bedrooms: parseInt(searchParams.get('bedrooms') || '0'),
  });

  const fetchProperties = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      const data = await api.getProperties(filters || currentFilters);
      setProperties(data);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleSearch = useCallback((filters: any) => {
    setCurrentFilters(filters);
    fetchProperties(filters);
    
    const params = new URLSearchParams();
    if (filters.location) params.set('location', filters.location);
    if (filters.checkIn) params.set('checkIn', filters.checkIn?.toISOString() || "");
    if (filters.checkOut) params.set('checkOut', filters.checkOut?.toISOString() || "");
    if (filters.homeType?.length) params.set('homeType', filters.homeType.join(','));
    if (filters.amenities?.length) params.set('amenities', filters.amenities.join(','));
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.bedrooms) params.set('bedrooms', filters.bedrooms.toString());
    
    window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
  }, [fetchProperties]);

  // Handle scroll behavior
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const scrolled = scrollY > 100;
          
          setShowSearchInNav(scrolled);
          setShowSearchBar(!scrolled);
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchClick = useCallback(() => {
    if (!showSearchBar) {
      setShowSearchBar(true);
      setShowSearchInNav(false);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          const locationInput = document.querySelector('input[placeholder="Search destinations"]') as HTMLInputElement;
          if (locationInput) {
            locationInput.focus();
          }
        }, 500);
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        const locationInput = document.querySelector('input[placeholder="Search destinations"]') as HTMLInputElement;
        if (locationInput) {
          locationInput.focus();
        }
      }, 500);
    }
  }, [showSearchBar]);

  const getPropertyImage = (property: Property): string => {
    if (!property.media || property.media.length === 0) {
      return '/placeholder.png';
    }
    
    const realImage = property.media.find(m => 
      m.url && !m.url.includes('placeimg.com') && !m.mediaUrl?.includes('placeimg.com')
    );
    
    const imageUrl = realImage?.url || realImage?.mediaUrl || property.media[0]?.url || property.media[0]?.mediaUrl;
    return imageUrl || '/placeholder.png';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar 
          onSearchClick={handleSearchClick}
          showSearchButton={showSearchInNav}
        />
        <SearchBar isVisible={showSearchBar} onSearch={handleSearch} />
        <div className="max-w-6xl mx-auto mt-8 px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border rounded-lg overflow-hidden animate-pulse bg-white">
                <div className="w-full h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar 
          onSearchClick={handleSearchClick}
          showSearchButton={showSearchInNav}
        />
        <SearchBar isVisible={showSearchBar} onSearch={handleSearch} />
        <div className="max-w-6xl mx-auto mt-8 px-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar 
        onSearchClick={handleSearchClick}
        showSearchButton={showSearchInNav}
      />
      
      <SearchBar isVisible={showSearchBar} onSearch={handleSearch} />

      <div className="max-w-6xl mx-auto px-4">
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No properties found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600 mt-8">
              Found {properties.length} properties
              {currentFilters.location && ` in ${currentFilters.location}`}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white border rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
                  onClick={() => router.push(`/listings/${property.id}`)}
                >
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={getPropertyImage(property)}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.png';
                      }}
                    />
                    {property.media && property.media.length > 1 && (
                      <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full">
                        +{property.media.length}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold text-lg truncate">{property.title}</h2>
                    <p className="text-gray-600 text-sm mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{property.location}</span>
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="text-red-600 font-semibold">
                        ${property.monthlyPrice.toLocaleString()}
                        <span className="text-sm text-gray-500 font-normal">/month</span>
                      </p>
                      {property.bedrooms && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          {property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}