"use client";

import { useState, ChangeEvent, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import { createProperty, updateProperty, uploadPropertyImages, getPropertyById } from "@/utils/api";
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
  const [editId, setEditId] = useState<string | null>(null);

  // Auto-save refs — all reads happen at call-time so no closure issues
  const autoSaveDraftIdRef = useRef<string | null>(null);
  const hasSubmittedRef = useRef(false);
  const formDataRef = useRef(formData);
  const editIdRef = useRef<string | null>(null);

  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { editIdRef.current = editId; }, [editId]);

  // Fire-and-forget draft save — safe to call from cleanup / beforeunload
  const autoSave = useCallback(() => {
    if (hasSubmittedRef.current || editIdRef.current) return;
    const data = formDataRef.current;
    if (!data.title.trim()) return;
    const token = localStorage.getItem("berenda_token");
    if (!token) return;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const body = JSON.stringify({
      title: data.title,
      description: data.description,
      location: data.location || "",
      latitude: data.latitude ? parseFloat(data.latitude) : 0,
      longitude: data.longitude ? parseFloat(data.longitude) : 0,
      monthlyPrice: data.monthlyPrice ? parseFloat(data.monthlyPrice) : 0,
      bedrooms: data.bedrooms ? parseInt(data.bedrooms) : undefined,
      bathrooms: data.bathrooms ? parseFloat(data.bathrooms) : undefined,
      area: data.area ? parseFloat(data.area) : undefined,
      amenities: data.amenities,
      isDraft: true,
    });
    if (autoSaveDraftIdRef.current) {
      fetch(`${API_BASE}/properties/${autoSaveDraftIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body,
        keepalive: true,
      }).catch(() => {});
    } else {
      fetch(`${API_BASE}/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body,
        keepalive: true,
      }).then(r => r.json()).then(res => {
        const id = res.data?.id || res.id;
        if (id) autoSaveDraftIdRef.current = id;
      }).catch(() => {});
    }
  }, []);

  // Register beforeunload (browser close/refresh) and unmount (in-app navigation)
  useEffect(() => {
    window.addEventListener("beforeunload", autoSave);
    return () => {
      window.removeEventListener("beforeunload", autoSave);
      autoSave();
    };
  }, [autoSave]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load property data for edit mode
  useEffect(() => {
    if (!isMounted) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("edit");
    if (!id) return;
    setEditId(id);
    getPropertyById(id).then((res) => {
      const p = res?.data || res;
      if (!p) return;
      setFormData({
        title: p.title || "",
        description: p.description || "",
        location: p.location || "",
        latitude: p.latitude?.toString() || "",
        longitude: p.longitude?.toString() || "",
        monthlyPrice: p.monthlyPrice?.toString() || "",
        bedrooms: p.bedrooms?.toString() || "",
        bathrooms: p.bathrooms?.toString() || "",
        area: p.area?.toString() || "",
        amenities: Array.isArray(p.amenities)
          ? p.amenities.map((a: any) => typeof a === "string" ? a : a?.amenity?.name ?? a?.name ?? "").filter(Boolean)
          : [],
      });
      if (p.latitude && p.longitude) {
        setMapSelected(true);
        setZoomToLocation({ lat: p.latitude, lng: p.longitude, address: p.location });
      }
    }).catch(console.error);
  }, [isMounted]);

  // Check authentication
  useEffect(() => {
    if (!isMounted) return;
    const token = localStorage.getItem("berenda_token");
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
      // Search within Ethiopia; bias toward Addis Ababa via viewbox but allow broader results
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ET&limit=8&addressdetails=1`;
      const response = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await response.json();
      setSearchResults(data);
      setShowSearchResults(data.length > 0);
    } catch (error) {
      console.error("Error searching locations:", error);
    }
  }, []);

  // Debounced search — only fire when not yet confirmed (mapSelected false)
  useEffect(() => {
    if (!isMounted || mapSelected) return;
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery.length >= 2) {
        searchLocations(searchQuery);
      } else if (!searchQuery) {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations, isMounted, mapSelected]);

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

  // Simplified geolocation
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
      setError("Please select a location from the search results or click on the map");
      return false;
    }
    if (!mapSelected) {
      setError("Please confirm your property location on the map");
      return false;
    }
    return true;
  };

  const validateMedia = () => {
    // In edit mode, new images are optional (property already has images)
    if (!editId && imageFiles.length === 0) {
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
      const token = localStorage.getItem("berenda_token");
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

  const handleSaveAsDraft = async () => {
    if (!formData.title.trim()) {
      setError("Please enter at least a title to save a draft");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        location: formData.location || "",
        latitude: formData.latitude ? parseFloat(formData.latitude) : 0,
        longitude: formData.longitude ? parseFloat(formData.longitude) : 0,
        monthlyPrice: formData.monthlyPrice ? parseFloat(formData.monthlyPrice) : 0,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
        amenities: formData.amenities,
        isDraft: true,
      };
      const response = await createProperty(payload);
      const propertyId = response.data?.id || response.id;
      if (propertyId) autoSaveDraftIdRef.current = propertyId;
      if (imageFiles.length > 0 && propertyId) {
        await uploadPropertyImages(propertyId, imageFiles);
      }
      hasSubmittedRef.current = true;
      setSuccessMessage("Draft saved! You can continue editing it from your profile.");
      setTimeout(() => router.push("/profile?tab=hosting"), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to save draft. Please try again.");
    } finally {
      setLoading(false);
    }
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

      let propertyId: string;
      if (editId) {
        await updateProperty(editId, propertyData);
        propertyId = editId;
        if (imageFiles.length > 0) {
          await uploadPropertyImages(propertyId, imageFiles);
        }
        setSuccessMessage("Property updated successfully!");
        hasSubmittedRef.current = true;
        setTimeout(() => router.push("/profile?tab=hosting"), 3000);
      } else {
        const response = await createProperty(propertyData);
        propertyId = response.data?.id || response.id;
        if (imageFiles.length > 0 && propertyId) {
          await uploadPropertyImages(propertyId, imageFiles);
        }
        hasSubmittedRef.current = true;
        setSuccessMessage(t("host.success"));
        setTimeout(() => router.push("/"), 3000);
      }

    } catch (err: any) {
      console.error("Error submitting property:", err);
      setError(err.message || (editId ? "Failed to update property." : "Failed to create property.") + " Please try again.");
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
          
          <h1 className="text-3xl font-light text-gray-900 mb-2">{editId ? "Edit Property" : t("host.listYourProperty")}</h1>
          <p className="text-gray-500">{editId ? "Update your property details below." : t("host.share")}</p>
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

        {/* Pending submission message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800 flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
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
              <div className="mb-4">
                <h2 className="text-xl font-light text-gray-900">{t("host.step.location")}</h2>
                <p className="text-sm text-gray-500 mt-1">Search for your location or click on the map</p>
              </div>

              {/* Search Location */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search for your address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location || searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setFormData(prev => ({ ...prev, location: e.target.value }));
                    if (!e.target.value) setMapSelected(false);
                  }}
                  placeholder="e.g., Bole, Addis Ababa or specific street name..."
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${mapSelected ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                  autoComplete="off"
                />
                {mapSelected && (
                  <button
                    type="button"
                    onClick={() => { setFormData(prev => ({ ...prev, location: "", latitude: "", longitude: "" })); setMapSelected(false); setSearchQuery(""); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >×</button>
                )}
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
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                      >
                        <p className="text-sm text-gray-800">{result.display_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Area Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or select a neighborhood
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

              {/* Map */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or click on the map to set exact location
                </label>
                <div className={`h-96 rounded-lg overflow-hidden border-2 ${!mapSelected ? 'border-gray-300' : 'border-green-500'}`}>
                  <MapWithNoSSR 
                    onLocationSelect={handleLocationSelect} 
                    zoomToLocation={zoomToLocation}
                  />
                </div>
                
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mapSelected}
                      readOnly
                      className="w-4 h-4 text-green-600"
                    />
                    <label className="text-sm text-gray-600">
                      {mapSelected
                        ? "✓ Location confirmed! You can proceed."
                        : "Select a location from search above or click on the map"}
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) return;
                      navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                          const { latitude: lat, longitude: lng } = pos.coords;
                          let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                          try {
                            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                            const d = await r.json();
                            if (d.display_name) address = d.display_name;
                          } catch {}
                          handleLocationSelect(lat, lng, address);
                        },
                        () => alert("Could not get your location. Please allow location access.")
                      );
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition whitespace-nowrap"
                  >
                    📍 Use my location
                  </button>
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-light text-gray-900">{t("host.amenities.title")}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t("host.amenities.subtitle")}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, amenities: [...AMENITIES_LIST] }))}
                    className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full hover:bg-red-100 transition"
                  >
                    {t("host.amenities.selectAll")}
                  </button>
                  {formData.amenities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, amenities: [] }))}
                      className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-full hover:bg-gray-100 transition"
                    >
                      {t("host.amenities.clearAll")}
                    </button>
                  )}
                </div>
              </div>

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

            <div className="flex items-center gap-2">
              {!editId && (
                <button
                  onClick={handleSaveAsDraft}
                  disabled={loading}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Save Draft
                </button>
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
                  {loading ? t("host.listing") : (editId ? "Update Listing" : t("host.button.list"))}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
