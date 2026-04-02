// frontend/src/components/home/SearchBar.tsx
"use client";

import { MapPin, Calendar, SlidersHorizontal, Search, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DateRangePicker } from "../DateRangePicker";
import { FilterModal } from "../FilterModal";

interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
}

interface SearchBarProps {
  isVisible?: boolean;
  onSearch?: (filters: any) => void;
}

export default function SearchBar({ isVisible = true, onSearch }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  
  const [location, setLocation] = useState(searchParams.get('location') || "");
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(
    searchParams.get('checkIn') ? new Date(searchParams.get('checkIn')!) : null
  );
  const [checkOut, setCheckOut] = useState<Date | null>(
    searchParams.get('checkOut') ? new Date(searchParams.get('checkOut')!) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeField, setActiveField] = useState<'location' | 'checkIn' | 'checkOut' | null>(null);
  const [filters, setFilters] = useState({
    homeType: searchParams.get('homeType')?.split(',') || [],
    amenities: searchParams.get('amenities')?.split(',') || [],
    priceRange: [
      parseInt(searchParams.get('minPrice') || '0'),
      parseInt(searchParams.get('maxPrice') || '5000')
    ],
    bedrooms: parseInt(searchParams.get('bedrooms') || '0'),
  });
  
  const locationRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/locations/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setSuggestions(data.data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      searchLocations(location);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [location, searchLocations]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showDatePicker || showFilterModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDatePicker, showFilterModal]);

  const handleSearch = () => {
    const searchFilters = {
      location: location,
      checkIn: checkIn,
      checkOut: checkOut,
      homeType: filters.homeType,
      amenities: filters.amenities,
      minPrice: filters.priceRange[0],
      maxPrice: filters.priceRange[1],
      bedrooms: filters.bedrooms,
    };

    if (onSearch) {
      onSearch(searchFilters);
    } else {
      const params = new URLSearchParams();
      if (location) params.set('location', location);
      if (checkIn) params.set('checkIn', checkIn.toISOString());
      if (checkOut) params.set('checkOut', checkOut.toISOString());
      if (filters.homeType.length) params.set('homeType', filters.homeType.join(","));
      if (filters.amenities.length) params.set('amenities', filters.amenities.join(","));
      if (filters.priceRange[0] > 0) params.set('minPrice', filters.priceRange[0].toString());
      if (filters.priceRange[1] < 5000) params.set('maxPrice', filters.priceRange[1].toString());
      if (filters.bedrooms > 0) params.set('bedrooms', filters.bedrooms.toString());
      
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleLocationSelect = (selectedLocation: Location) => {
    const locationString = `${selectedLocation.name}, ${selectedLocation.city}, ${selectedLocation.country}`;
    setLocation(locationString);
    setShowSuggestions(false);
    setActiveField(null);
    
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const clearLocation = () => {
    setLocation("");
    setSuggestions([]);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Add date";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActiveFieldClass = (field: string) => {
    return activeField === field ? 'ring-2 ring-red-500 ring-opacity-50 bg-red-50' : '';
  };

  const hasActiveFilters = () => {
    return filters.homeType.length > 0 || 
           filters.amenities.length > 0 || 
           filters.priceRange[0] > 0 || 
           filters.priceRange[1] < 5000 || 
           filters.bedrooms > 0;
  };

  const hasDates = checkIn || checkOut;

  return (
    <>
      <div 
        ref={searchBarRef}
        className="w-full flex justify-center px-3 sm:px-4 md:px-6 transition-all duration-500 ease-in-out"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
          pointerEvents: isVisible ? 'auto' : 'none',
          position: 'relative',
          zIndex: 20,
        }}
      >
        <div className="w-full max-w-5xl bg-white rounded-2xl sm:rounded-full shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
          
          {/* Mobile Layout - Stacked */}
          <div className="block sm:hidden p-4 space-y-3">
            {/* Where - Mobile */}
            <div ref={locationRef} className="relative">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Where</p>
                  <input
                    className="text-gray-800 text-sm outline-none bg-transparent w-full font-medium"
                    placeholder="Search destinations"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onFocus={() => setActiveField('location')}
                    onBlur={() => setTimeout(() => setActiveField(null), 200)}
                  />
                </div>
                {location && (
                  <button onClick={clearLocation} className="flex-shrink-0">
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
                {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />}
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border z-50 max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleLocationSelect(suggestion)}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{suggestion.name}</p>
                        <p className="text-xs text-gray-500">{suggestion.city}, {suggestion.country}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dates Row - Mobile */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowDatePicker(true)}
                className="bg-gray-50 rounded-xl p-3 text-left hover:bg-gray-100 transition"
              >
                <Calendar className="w-4 h-4 text-red-500 mb-1" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Check In</p>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {formatDate(checkIn)}
                </p>
              </button>
              <button
                onClick={() => setShowDatePicker(true)}
                className="bg-gray-50 rounded-xl p-3 text-left hover:bg-gray-100 transition"
              >
                <Calendar className="w-4 h-4 text-red-500 mb-1" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Check Out</p>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {formatDate(checkOut)}
                </p>
              </button>
            </div>

            {/* Action Buttons - Mobile */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex-1 bg-gray-50 rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-gray-100 transition"
              >
                <SlidersHorizontal className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Filters {hasActiveFilters() && `(${filters.homeType.length + filters.amenities.length})`}
                </span>
              </button>
              <button
                onClick={handleSearch}
                className="flex-1 bg-red-500 hover:bg-red-600 rounded-xl p-3 flex items-center justify-center gap-2 transition shadow-md"
              >
                <Search className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Search</span>
              </button>
            </div>
          </div>

          {/* Desktop Layout - Horizontal */}
          <div className="hidden sm:flex items-center px-4 py-2 gap-2">
            {/* Where - Desktop */}
            <div ref={locationRef} className={`flex-1 relative rounded-full transition-all duration-200 ${getActiveFieldClass('location')}`}>
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-full transition">
                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Where</p>
                  <div className="relative">
                    <input
                      className="text-gray-800 text-sm outline-none bg-transparent w-full font-medium pr-6"
                      placeholder="Search destinations"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onFocus={() => setActiveField('location')}
                      onBlur={() => setTimeout(() => setActiveField(null), 200)}
                    />
                    {location && (
                      <button
                        onClick={clearLocation}
                        className="absolute right-0 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                    {loading && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border z-50 max-h-96 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleLocationSelect(suggestion)}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors text-left"
                    >
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{suggestion.name}</p>
                        <p className="text-xs text-gray-500">{suggestion.city}, {suggestion.country}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-10 w-px bg-gray-200" />

            {/* Check In - Desktop */}
            <button
              onClick={() => setShowDatePicker(true)}
              className={`flex-1 text-left rounded-full transition-all duration-200 ${hasDates ? 'bg-red-50' : ''} ${getActiveFieldClass('checkIn')}`}
              onFocus={() => setActiveField('checkIn')}
              onBlur={() => setTimeout(() => setActiveField(null), 200)}
            >
              <div className="px-4 py-3 hover:bg-gray-50 rounded-full transition">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Check In</p>
                <p className={`text-sm font-medium truncate ${checkIn ? 'text-gray-800' : 'text-gray-400'}`}>
                  {formatDate(checkIn)}
                </p>
              </div>
            </button>

            <div className="h-10 w-px bg-gray-200" />

            {/* Check Out - Desktop */}
            <button
              onClick={() => setShowDatePicker(true)}
              className={`flex-1 text-left rounded-full transition-all duration-200 ${hasDates ? 'bg-red-50' : ''} ${getActiveFieldClass('checkOut')}`}
              onFocus={() => setActiveField('checkOut')}
              onBlur={() => setTimeout(() => setActiveField(null), 200)}
            >
              <div className="px-4 py-3 hover:bg-gray-50 rounded-full transition">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Check Out</p>
                <p className={`text-sm font-medium truncate ${checkOut ? 'text-gray-800' : 'text-gray-400'}`}>
                  {formatDate(checkOut)}
                </p>
              </div>
            </button>

            <div className="h-10 w-px bg-gray-200" />

            {/* Filters Button - Desktop */}
            <button
              onClick={() => setShowFilterModal(true)}
              className={`relative px-4 py-3 rounded-full transition-all duration-200 hover:bg-gray-50 ${hasActiveFilters() ? 'bg-red-50' : ''}`}
            >
              <SlidersHorizontal className={`w-5 h-5 ${hasActiveFilters() ? 'text-red-500' : 'text-gray-600'}`} />
              {hasActiveFilters() && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Search Button - Desktop */}
            <button
              onClick={handleSearch}
              className="ml-1 w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onCheckInChange={setCheckIn}
          onCheckOutChange={setCheckOut}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </>
  );
}