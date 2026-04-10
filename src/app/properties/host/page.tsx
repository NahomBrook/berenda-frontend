"use client";

import { useState, ChangeEvent, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import { createProperty, uploadPropertyImages } from "@/utils/api";
import DragDropImageUpload from "@/components/DragDropImageUpload";
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Ref to track if location request is active
  const locationRequestRef = useRef<boolean>(false);

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
    
    setZoomToLocation({ lat: area.lat, lng: area.lng, address });
  };

  // IP-based location fallback
  const getLocationByIP = async () => {
    if (gettingLocation) return;
    
    setGettingLocation(true);
    setError(null);
    
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        const address = `${data.city}, ${data.region}, ${data.country_name}`;
        setFormData(prev => ({
          ...prev,
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString(),
          location: address,
        }));
        setMapSelected(true);
        setZoomToLocation({ 
          lat: data.latitude, 
          lng: data.longitude, 
          address: address 
        });
        setError(null);
      } else {
        throw new Error("No location data");
      }
    } catch (err) {
      console.error("IP geolocation failed:", err);
      setError("Could not detect location. Please use the search bar or click on the map.");
    } finally {
      setGettingLocation(false);
    }
  };

  // Browser geolocation
  const getCurrentLocation = () => {
    if (gettingLocation) return;
    
    setGettingLocation(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError("Your browser doesn't support geolocation. Please use the search bar or click on the map.");
      setGettingLocation(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setGettingLocation(false);
      setError("Location request timed out. Try using 'Approximate Location' or search manually.");
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }));
        setMapSelected(true);
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`)
          .then(res => res.json())
          .then(data => {
            const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setFormData(prev => ({
              ...prev,
              location: address.length > 100 ? address.substring(0, 100) + "..." : address,
            }));
            setZoomToLocation({ lat: latitude, lng: longitude, address });
          })
          .catch(() => {
            setZoomToLocation({ lat: latitude, lng: longitude, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
          });
        
        setGettingLocation(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error("Geolocation error:", error);
        
        let errorMessage = "";
        switch(error.code) {
          case 1:
            errorMessage = "Location access denied. Please allow location access in your browser settings.";
            break;
          case 2:
            errorMessage = "Location unavailable. Please use the search bar.";
            break;
          case 3:
            errorMessage = "Location request timed out. Try 'Approximate Location' or search manually.";
            break;
          default:
            errorMessage = "Failed to get location. Please use the search bar.";
        }
        setError(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000
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

  const addToWishlist = async (propertyId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ propertyId }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      return false;
    }
  };

  const handleSubmit = async () => {
    setError(null);
    
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You need to login again. Redirecting...");
      setTimeout(() => router.push("/auth/login"), 2000);
      return;
    }
    
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

      const addToWishlistConfirm = window.confirm(
        "Property listed successfully! Would you like to add it to your wishlist?"
      );
      
      if (addToWishlistConfirm && propertyId) {
        await addToWishlist(propertyId);
      }

      setSuccessMessage(t("host.success"));
      setTimeout(() => router.push(`/listings/${propertyId}`), 2500);
      
    } catch (err: any) {
      console.error("Error creating property:", err);
      if (err.message?.includes("token") || err.message?.includes("unauthorized") || err.status === 401) {
        setError("Your session has expired. Please login again.");
        localStorage.removeItem("token");
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        setError(err.message || "Failed to create property. Please try again.");
      }
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
            {t("common.back")}
          </button>
          
          <h1 className="text-3xl font-light text-gray-900 mb-2">{t("host.listYourProperty")}</h1>
          <p className="text-gray-500">{t("host.share")}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span className={currentStep >= HostingStep.BASIC_INFO ? "text-red-600" : ""}>{t("host.step.basicInfo")}</span>
            <span className={currentStep >= HostingStep.LOCATION ? "text-red-600" : ""}>{t("host.step.location")}</span>
            <span className={currentStep >= HostingStep.MEDIA ? "text-red-600" : ""}>{t("host.step.media")}</span>
            <span className={currentStep >= HostingStep.AMENITIES ? "text-red-600" : ""}>{t("host.step.amenities")}</span>
            <span className={currentStep >= HostingStep.REVIEW ? "text-red-600" : ""}>{t("host.step.review")}</span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full">
            <div 
              className="h-1 bg-red-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        )}

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
              <h2 className="text-xl font-light text-gray-900 mb-4">{t("host.section.basic")}</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("host.propertyTitle")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={t("host.titlePlaceholder")}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("host.description")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={t("host.descriptionPlaceholder")}
                  maxLength={1000}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("host.field.monthlyPrice")} <span className="text-red-500">*</span>
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
                    {t("host.field.bedrooms")}
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
                    {t("host.field.bathrooms")}
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="1"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("host.area")}
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
                <h2 className="text-xl font-light text-gray-900">{t("host.step.location")}</h2>
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

              {/* Location Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {gettingLocation ? "Getting location..." : "Use my current location"}
                </button>
                
                <button
                  type="button"
                  onClick={getLocationByIP}
                  disabled={gettingLocation}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9" />
                  </svg>
                  Use approximate location (IP)
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
                  placeholder="Address will appear when you select a location"
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
                      : "⚠️ Required: Select a location from the map, search, or use location buttons above"}
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

          {/* Step 3: Media with Drag & Drop */}
          {currentStep === HostingStep.MEDIA && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-light text-gray-900 mb-1">{t("host.photos.title")}</h2>
                  <p className="text-sm text-gray-500">{t("host.photos.subtitle")}</p>
                </div>
                <div className="text-sm text-gray-400">
                  {imageFiles.length} / 10 {t("host.photos.uploaded")}
                </div>
              </div>

              <DragDropImageUpload
                imagePreviews={imagePreviews}
                onImagesChange={(newFiles) => {
                  setImageFiles(prev => [...prev, ...newFiles]);
                  const newPreviews = newFiles.map(file => URL.createObjectURL(file));
                  setImagePreviews(prev => [...prev, ...newPreviews]);
                }}
                onRemoveImage={removeImage}
                maxImages={10}
              />

              {imageFiles.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Tips for great property photos</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Use natural lighting for bright, inviting photos</li>
                    <li>• Capture each room from multiple angles</li>
                    <li>• Show unique features (balcony, view, appliances)</li>
                    <li>• Ensure photos are clear and high-resolution</li>
                    <li>• The first photo will be your cover image</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Amenities */}
          {currentStep === HostingStep.AMENITIES && (
            <div className="space-y-6">
              <h2 className="text-xl font-light text-gray-900 mb-4">{t("host.amenities.title")}</h2>
              <p className="text-sm text-gray-500 mb-4">{t("host.amenities.subtitle")}</p>

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
              <h2 className="text-xl font-light text-gray-900 mb-4">{t("host.review.title")}</h2>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="space-y-3">
                  <div className="flex items-baseline gap-4">
                    <span className="text-gray-500 w-28 shrink-0">Title:</span>
                    <span className="text-gray-900 font-medium">{formData.title || "Untitled Property"}</span>
                  </div>
                  
                  <div className="flex items-baseline gap-4">
                    <span className="text-gray-500 w-28 shrink-0">Location:</span>
                    <span className="text-gray-700">{formData.location || "Not set"}</span>
                  </div>
                  
                  <div className="flex items-baseline gap-4">
                    <span className="text-gray-500 w-28 shrink-0">Monthly Price:</span>
                    <span className="text-red-600 font-semibold">ETB {formData.monthlyPrice || "0"}</span>
                  </div>
                  
                  {formData.bedrooms && (
                    <div className="flex items-baseline gap-4">
                      <span className="text-gray-500 w-28 shrink-0">Bedrooms:</span>
                      <span className="text-gray-700">{formData.bedrooms}</span>
                    </div>
                  )}
                  
                  {formData.bathrooms && (
                    <div className="flex items-baseline gap-4">
                      <span className="text-gray-500 w-28 shrink-0">Bathrooms:</span>
                      <span className="text-gray-700">{formData.bathrooms}</span>
                    </div>
                  )}
                  
                  {formData.area && (
                    <div className="flex items-baseline gap-4">
                      <span className="text-gray-500 w-28 shrink-0">Area:</span>
                      <span className="text-gray-700">{formData.area} m²</span>
                    </div>
                  )}
                  
                  <div className="flex items-baseline gap-4">
                    <span className="text-gray-500 w-28 shrink-0">Coordinates:</span>
                    <span className="text-gray-600 font-mono text-sm">
                      {formData.latitude && formData.longitude 
                        ? `${parseFloat(formData.latitude).toFixed(6)}, ${parseFloat(formData.longitude).toFixed(6)}`
                        : "Not selected"}
                    </span>
                  </div>
                  
                  {formData.amenities.length > 0 && (
                    <div className="flex gap-4">
                      <span className="text-gray-500 w-28 shrink-0">Amenities:</span>
                      <div className="flex flex-wrap gap-1">
                        {formData.amenities.map((a) => (
                          <span key={a} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <span className="text-gray-500 w-28 shrink-0">Images:</span>
                    <span className="text-gray-700">{imageFiles.length} {imageFiles.length === 1 ? 'image' : 'images'} uploaded</span>
                  </div>
                  
                  {formData.description && (
                    <div className="flex gap-4">
                      <span className="text-gray-500 w-28 shrink-0">Description:</span>
                      <p className="text-gray-700 text-sm flex-1">{formData.description}</p>
                    </div>
                  )}
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
                {t("host.back")}
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < HostingStep.REVIEW ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                {t("host.next")}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? t("host.listing") : t("host.button.list")}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}