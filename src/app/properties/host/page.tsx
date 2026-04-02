// frontend/src/app/properties/host/page.tsx
"use client";

import { useState, ChangeEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/NavBar";
import { createProperty, uploadPropertyImages } from "@/utils/api";

// Dynamically import map components with no SSR
const MapWithNoSSR = dynamic(
  () => import("@/components/PropertyMapPicker"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }
);

// Steps for the multi-step form
enum HostingStep {
  BASIC_INFO,
  LOCATION,
  MEDIA,
  AMENITIES,
  REVIEW
}

// Amenities list based on schema
const AMENITIES_LIST = [
  "WiFi",
  "Kitchen",
  "Washer",
  "Dryer",
  "Air conditioning",
  "Heating",
  "Dedicated workspace",
  "TV",
  "Hair dryer",
  "Iron",
  "Pool",
  "Hot tub",
  "Free parking",
  "EV charger",
  "Pet friendly",
  "Smoking allowed",
  "Smoke alarm",
  "Carbon monoxide alarm",
  "First aid kit",
  "Fire extinguisher",
  "Wheelchair accessible",
  "Elevator"
];

// Sub cities in Addis Ababa for quick selection
const ADDIS_ABABA_AREAS = [
  { name: "Bole", lat: 9.0320, lng: 38.7469 },
  { name: "Kazanchis", lat: 9.0198, lng: 38.7647 },
  { name: "Megenagna", lat: 9.0425, lng: 38.7889 },
  { name: "Piassa", lat: 9.0258, lng: 38.7512 },
  { name: "Entoto", lat: 9.0891, lng: 38.7602 },
  { name: "CMC", lat: 8.9979, lng: 38.8132 },
  { name: "Ayat", lat: 9.0083, lng: 38.8500 },
  { name: "Mexico", lat: 9.0134, lng: 38.7365 },
  { name: "Sarbet", lat: 9.0067, lng: 38.7189 },
  { name: "Lideta", lat: 9.0078, lng: 38.7289 },
  { name: "Kirkos", lat: 9.0100, lng: 38.7400 },
  { name: "Gergi", lat: 9.0556, lng: 38.8083 },
];

export default function HostPropertyPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<HostingStep>(HostingStep.BASIC_INFO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [zoomToLocation, setZoomToLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  
  // Location state
  const [mapSelected, setMapSelected] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    monthlyPrice: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    amenities: [] as string[],
  });
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check authentication
  useEffect(() => {
    if (!isMounted) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router, isMounted]);

  // Search locations
  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Addis Ababa, Ethiopia")}&limit=5`);
      const data = await response.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching locations:", error);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocations(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations, isMounted]);

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData(prev => ({
      ...prev,
      location: address,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
    setMapSelected(true);
    setShowSearchResults(false);
    setSearchQuery("");
    
    // Navigate the map to this location
    setZoomToLocation({ lat, lng, address });
  };

  const handleAreaSelect = (area: { name: string; lat: number; lng: number }) => {
    const address = `${area.name}, Addis Ababa, Ethiopia`;
    setFormData(prev => ({
      ...prev,
      location: address,
      latitude: area.lat.toString(),
      longitude: area.lng.toString(),
    }));
    setMapSelected(true);
    setShowSearchResults(false);
    setSearchQuery("");
    
    // Navigate the map to this location
    setZoomToLocation({ lat: area.lat, lng: area.lng, address });
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          const address = data.display_name || `${latitude}, ${longitude}`;
          
          setFormData(prev => ({
            ...prev,
            location: address,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          }));
          setMapSelected(true);
          
          // Navigate the map to current location
          setZoomToLocation({ lat: latitude, lng: longitude, address });
        } catch (err) {
          console.error("Error getting location details:", err);
          setError("Failed to get location details");
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError("Failed to get your location. Please select on map.");
        setGettingLocation(false);
      }
    );
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateBasicInfo = () => {
    if (!formData.title.trim()) {
      setError("Please enter a property title");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Please enter a property description");
      return false;
    }
    if (!formData.monthlyPrice || Number(formData.monthlyPrice) <= 0) {
      setError("Please enter a valid monthly price");
      return false;
    }
    return true;
  };

  const validateLocation = () => {
    if (!formData.location.trim()) {
      setError("Please enter property location");
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      setError("Please select a location on the map");
      return false;
    }
    if (!mapSelected) {
      setError("Please click on the map to confirm your property location");
      return false;
    }
    return true;
  };

  const validateMedia = () => {
    if (imageFiles.length === 0) {
      setError("Please upload at least one image of your property");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    
    switch (currentStep) {
      case HostingStep.BASIC_INFO:
        if (validateBasicInfo()) {
          setCurrentStep(HostingStep.LOCATION);
        }
        break;
      case HostingStep.LOCATION:
        if (validateLocation()) {
          setCurrentStep(HostingStep.MEDIA);
        }
        break;
      case HostingStep.MEDIA:
        if (validateMedia()) {
          setCurrentStep(HostingStep.AMENITIES);
        }
        break;
      case HostingStep.AMENITIES:
        setCurrentStep(HostingStep.REVIEW);
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => {
      if (prev === HostingStep.LOCATION) return HostingStep.BASIC_INFO;
      if (prev === HostingStep.MEDIA) return HostingStep.LOCATION;
      if (prev === HostingStep.AMENITIES) return HostingStep.MEDIA;
      if (prev === HostingStep.REVIEW) return HostingStep.AMENITIES;
      return prev;
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const propertyData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        monthlyPrice: parseFloat(formData.monthlyPrice),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
        amenities: formData.amenities,
      };

      const response = await createProperty(propertyData);
      const propertyId = response.data?.id || response.id;

      if (imageFiles.length > 0 && propertyId) {
        await uploadPropertyImages(propertyId, imageFiles);
      }

      router.push(`/listings/${propertyId}`);
      
    } catch (err: any) {
      console.error("Error creating property:", err);
      setError(err.message || "Failed to create property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted || !isAuthenticated) {
    return null;
  }

  const progressPercentage = 
    currentStep === HostingStep.BASIC_INFO ? 20 :
    currentStep === HostingStep.LOCATION ? 40 :
    currentStep === HostingStep.MEDIA ? 60 :
    currentStep === HostingStep.AMENITIES ? 80 : 100;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-3xl mx-auto mt-8 px-4 pb-16">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 inline-flex items-center mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <h1 className="text-3xl font-light text-gray-900 mb-2">List Your Property</h1>
          <p className="text-gray-500">Share your space and start earning</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span className={currentStep >= HostingStep.BASIC_INFO ? "text-red-600" : ""}>Basic Info</span>
            <span className={currentStep >= HostingStep.LOCATION ? "text-red-600" : ""}>Location</span>
            <span className={currentStep >= HostingStep.MEDIA ? "text-red-600" : ""}>Media</span>
            <span className={currentStep >= HostingStep.AMENITIES ? "text-red-600" : ""}>Amenities</span>
            <span className={currentStep >= HostingStep.REVIEW ? "text-red-600" : ""}>Review</span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full">
            <div 
              className="h-1 bg-red-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          {/* Step 1: Basic Info */}
          {currentStep === HostingStep.BASIC_INFO && (
            <div className="space-y-6">
              <h2 className="text-xl font-light text-gray-900 mb-4">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Cozy Studio in Downtown"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Describe your property..."
                  maxLength={1000}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="monthlyPrice"
                    value={formData.monthlyPrice}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="1200"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="2"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="1.5"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area (m²)
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="75"
                  min="0"
                />
              </div>
            </div>
          )}

          {/* Step 2: Location with Map */}
          {currentStep === HostingStep.LOCATION && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-light text-gray-900">Location</h2>
              </div>

              {/* Quick Area Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Select Area in Addis Ababa
                </label>
                <div className="flex flex-wrap gap-2">
                  {ADDIS_ABABA_AREAS.map((area) => (
                    <button
                      key={area.name}
                      type="button"
                      onClick={() => handleAreaSelect(area)}
                      className="px-3 py-1 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600 rounded-full text-sm transition"
                    >
                      {area.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Location */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search for a specific location
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a place, landmark, or address..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleLocationSelect(
                          parseFloat(result.lat),
                          parseFloat(result.lon),
                          result.display_name
                        )}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <p className="text-sm text-gray-800">{result.display_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Use Current Location Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {gettingLocation ? "Getting location..." : "Use my current location"}
                </button>
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address/Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Address will appear when you click on the map"
                  readOnly
                />
              </div>

              {/* Map */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Click on the map to set exact location <span className="text-red-500">*</span>
                </label>
                <div className={`h-96 rounded-lg overflow-hidden border-2 ${!mapSelected ? 'border-red-500' : 'border-gray-300'}`}>
                  <MapWithNoSSR 
                    onLocationSelect={handleLocationSelect} 
                    zoomToLocation={zoomToLocation}
                  />
                </div>
                
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mapSelected}
                    readOnly
                    className="w-4 h-4 text-red-600"
                  />
                  <label className="text-sm text-gray-600">
                    {mapSelected 
                      ? "✓ Location selected! You can proceed." 
                      : "⚠️ Required: Click on the map to select your property location"}
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                    <input
                      type="text"
                      value={formData.latitude}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1 text-sm bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                    <input
                      type="text"
                      value={formData.longitude}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1 text-sm bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Media */}
          {currentStep === HostingStep.MEDIA && (
            <div className="space-y-6">
              <h2 className="text-xl font-light text-gray-900 mb-4">Property Photos</h2>
              <p className="text-sm text-gray-500 mb-2">
                Upload up to 10 photos. The first photo will be the cover image.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer inline-flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-red-600 font-medium">Click to upload</span>
                  <span className="text-gray-500 text-sm mt-1">or drag and drop</span>
                  <span className="text-gray-400 text-xs mt-2">PNG, JPG, WEBP up to 10MB each</span>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Uploaded Images ({imagePreviews.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Amenities */}
          {currentStep === HostingStep.AMENITIES && (
            <div className="space-y-6">
              <h2 className="text-xl font-light text-gray-900 mb-4">Amenities</h2>
              <p className="text-sm text-gray-500 mb-4">
                Select all amenities that your property offers
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITIES_LIST.map((amenity) => (
                  <label
                    key={amenity}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                      formData.amenities.includes(amenity)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="hidden"
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === HostingStep.REVIEW && (
            <div className="space-y-6">
              <h2 className="text-xl font-light text-gray-900 mb-4">Review Your Listing</h2>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{formData.title || "Untitled Property"}</h3>
                  <p className="text-sm text-gray-600">{formData.location || "Location not set"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Monthly Price:</span>
                    <span className="ml-2 font-medium text-gray-900">${formData.monthlyPrice || "0"}</span>
                  </div>
                  {formData.bedrooms && (
                    <div>
                      <span className="text-gray-500">Bedrooms:</span>
                      <span className="ml-2 text-gray-900">{formData.bedrooms}</span>
                    </div>
                  )}
                  {formData.bathrooms && (
                    <div>
                      <span className="text-gray-500">Bathrooms:</span>
                      <span className="ml-2 text-gray-900">{formData.bathrooms}</span>
                    </div>
                  )}
                  {formData.area && (
                    <div>
                      <span className="text-gray-500">Area:</span>
                      <span className="ml-2 text-gray-900">{formData.area} m²</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-sm text-gray-500">Coordinates:</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {formData.latitude && formData.longitude 
                      ? `${formData.latitude}, ${formData.longitude}`
                      : "Not selected"}
                  </p>
                </div>

                {formData.amenities.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Amenities:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.amenities.map((a) => (
                        <span key={a} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-sm text-gray-500">Images:</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {imageFiles.length} {imageFiles.length === 1 ? 'image' : 'images'} uploaded
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                By clicking "List Property", you agree that your property will be listed on our platform 
                and subject to our terms and conditions.
              </p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {currentStep > HostingStep.BASIC_INFO ? (
              <button
                onClick={handleBack}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}
            
            {currentStep < HostingStep.REVIEW ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Listing...' : 'List Property'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}