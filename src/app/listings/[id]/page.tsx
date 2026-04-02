// frontend/src/app/listings/[id]/page.tsx
"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getPropertyById,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
} from "../../../utils/api";
import Navbar from "@/components/layout/NavBar";
import { MessageCircle, Bed, Bath, Users, Maximize2, Calendar, Home, Wifi, Coffee, Car, Tv, Dumbbell, Waves, Wind, Utensils, ParkingCircle, Dog, Sparkles } from "lucide-react";
import { DateRangePicker } from "@/components/DateRangePicker";

// Dynamically import map component with no SSR and ensure it's rendered with lower z-index
const PropertyMapDisplay = dynamic(
  () => import("@/components/PropertyMapDisplay"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface Property {
  id: string;
  title: string;
  location: string;
  description: string;
  monthlyPrice: number;
  media: { url?: string; mediaUrl?: string; id?: string }[];
  ownerId?: string;
  owner?: {
    fullName?: string;
    email?: string;
  };
  approvalStatus?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  isAvailable?: boolean;
  minStay?: number;
  maxGuests?: number;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
}

interface User {
  id: string;
  email?: string;
  fullName?: string;
}

// Amenity icons mapping
const amenityIcons: Record<string, any> = {
  "WiFi": Wifi,
  "Kitchen": Utensils,
  "Washer": Home,
  "Dryer": Home,
  "Air conditioning": Wind,
  "Heating": Wind,
  "Pool": Waves,
  "Hot tub": Waves,
  "Free parking": ParkingCircle,
  "EV charger": Car,
  "Pet friendly": Dog,
  "TV": Tv,
  "Gym": Dumbbell,
  "Workspace": Coffee,
  "Beach access": Waves,
  "Mountain view": Maximize2,
};

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [property, setProperty] = useState<Property | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    description: "",
    monthlyPrice: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    maxGuests: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Booking state
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [guests, setGuests] = useState(1);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState<'details' | 'payment'>('details');
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const safeMonthlyPrice = property?.monthlyPrice || 0;
  const safeTitle = property?.title || '';
  const safeLocation = property?.location || '';
  const safeDescription = property?.description || '';

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user:", e);
      }
    }

    if (!propertyId) {
      setError("Property ID not found");
      setLoading(false);
      return;
    }

    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching property with ID:", propertyId);
        
        const data = await getPropertyById(propertyId);
        console.log("Fetched property data:", data);
        
        if (!data || (!data.id && !data.data)) {
          throw new Error("Property not found");
        }
        
        // Handle response structure (data might be wrapped in data.data)
        const propertyData = data.data || data;
        setProperty(propertyData);
        
        setFormData({
          title: propertyData.title || "",
          location: propertyData.location || "",
          description: propertyData.description || "",
          monthlyPrice: propertyData.monthlyPrice?.toString() || "0",
          bedrooms: propertyData.bedrooms?.toString() || "",
          bathrooms: propertyData.bathrooms?.toString() || "",
          area: propertyData.area?.toString() || "",
          maxGuests: propertyData.maxGuests?.toString() || "",
        });
      } catch (error) {
        console.error("Error fetching property:", error);
        setError("Failed to load property. Please try again.");
        setMessage({ 
          text: "Failed to load property. Please try again.", 
          type: "error" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  const getImageUrl = (media: any, index: number = 0): string => {
    if (!media || media.length === 0) return '/placeholder.png';
    const item = media[index] || media[0];
    return item?.url || item?.mediaUrl || '/placeholder.png';
  };

  const getValidImages = (): string[] => {
    if (!property?.media || property.media.length === 0) return ['/placeholder.png'];
    return property.media.map((m, i) => getImageUrl(property.media, i)).filter(url => url && url !== '/placeholder.png');
  };

  const nextImage = () => {
    const images = getValidImages();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    const images = getValidImages();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleCheckAvailability = async () => {
    if (!propertyId) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    if (!checkIn || !checkOut) {
      setMessage({ 
        text: "Please select check-in and check-out dates.", 
        type: "error" 
      });
      return;
    }

    try {
      setCheckingAvailability(true);
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/check-availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          guests: guests
        }),
      });

      const result = await response.json();
      console.log("Availability result:", result);
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to check availability");
      }
      
      setAvailabilityResult(result);
      
      if (result.eligible) {
        setBookingStep('payment');
        setMessage({ text: result.message || "Property is available! Proceed to payment.", type: "success" });
      } else {
        setMessage({ text: result.message || "Property not available for selected dates.", type: "error" });
      }
    } catch (err: any) {
      console.error("Error checking availability:", err);
      setMessage({ 
        text: err.message || "Failed to check availability. Please try again.", 
        type: "error" 
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleProceedToPayment = () => {
    const bookingDetails = {
      propertyId,
      propertyTitle: property?.title,
      propertyLocation: property?.location,
      checkIn: checkIn?.toISOString(),
      checkOut: checkOut?.toISOString(),
      guests,
      totalPrice: availabilityResult?.price?.total || 0,
      nightlyRate: availabilityResult?.price?.dailyRate || (safeMonthlyPrice / 30),
      nights: availabilityResult?.price?.nights || 0,
      monthlyPrice: property?.monthlyPrice,
    };
    
    sessionStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
    router.push(`/payment/${propertyId}`);
  };

  const handleContactHost = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          participantId: property?.ownerId,
          propertyId: property?.id,
          propertyTitle: property?.title,
        }),
      });

      if (!response.ok) throw new Error("Failed to start chat");
      
      const data = await response.json();
      router.push(`/chat?chatId=${data.chatId}`);
    } catch (err) {
      console.error("Error starting chat:", err);
      setMessage({ 
        text: "Failed to start chat. Please try again.", 
        type: "error" 
      });
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Add dates";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOwner = user?.id === property?.ownerId;
  const images = getValidImages();

  if (loading) {
    return (
      <main>
        <Navbar />
        <div className="max-w-6xl mx-auto mt-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-lg mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-64 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main>
        <Navbar />
        <div className="max-w-4xl mx-auto mt-8 px-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <p className="text-red-600 mb-4">{error || "Property not found"}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 text-red-500 hover:text-red-600"
            >
              Return to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto mt-8 px-4 pb-16">
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" :
            message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" :
            "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
            {message.text}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 inline-flex items-center mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to listings
          </button>
          
          <h1 className="text-3xl font-light text-gray-900 mb-2">{safeTitle}</h1>
          <div className="flex items-center text-gray-500">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{safeLocation}</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-semibold text-red-600">${safeMonthlyPrice.toLocaleString()}</span>
            <span className="text-gray-500">/month</span>
          </div>
          {property.approvalStatus === 'pending' && (
            <span className="inline-block mt-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm border border-yellow-200">
              Pending Approval
            </span>
          )}
        </div>

        {/* Image Gallery */}
        <div className="mb-8">
          <div className="relative h-80 md:h-96 rounded-xl overflow-hidden bg-gray-100">
            <img
              src={images[currentImageIndex]}
              alt={`${safeTitle} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-contain cursor-pointer bg-gray-50"
              onClick={() => setSelectedImage(images[currentImageIndex])}
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                    currentImageIndex === idx ? 'border-red-500' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[1000]"
            onClick={() => setSelectedImage(null)}
          >
            <img 
              src={selectedImage} 
              alt="Enlarged view" 
              className="max-w-5xl max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.bedrooms && (
                <div className="bg-white p-4 rounded-lg border border-gray-100 flex items-center gap-3">
                  <Bed className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{property.bedrooms}</div>
                    <div className="text-sm text-gray-500">Bedrooms</div>
                  </div>
                </div>
              )}
              {property.bathrooms && (
                <div className="bg-white p-4 rounded-lg border border-gray-100 flex items-center gap-3">
                  <Bath className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{property.bathrooms}</div>
                    <div className="text-sm text-gray-500">Bathrooms</div>
                  </div>
                </div>
              )}
              {property.maxGuests && (
                <div className="bg-white p-4 rounded-lg border border-gray-100 flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{property.maxGuests}</div>
                    <div className="text-sm text-gray-500">Max Guests</div>
                  </div>
                </div>
              )}
              {property.area && (
                <div className="bg-white p-4 rounded-lg border border-gray-100 flex items-center gap-3">
                  <Maximize2 className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{property.area} m²</div>
                    <div className="text-sm text-gray-500">Living area</div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-lg border border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-3">About this property</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {safeDescription || 'No description provided.'}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white p-6 rounded-lg border border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity] || Sparkles;
                    return (
                      <div key={amenity} className="flex items-center gap-3 text-gray-600">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location Map - with lower z-index */}
            {property.latitude && property.longitude && (
              <div className="bg-white p-6 rounded-lg border border-gray-100 relative z-0">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Location</h2>
                <div className="h-64 rounded-lg overflow-hidden">
                  <PropertyMapDisplay 
                    latitude={property.latitude} 
                    longitude={property.longitude} 
                    address={property.location}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  📍 {property.location}
                </p>
              </div>
            )}

            {/* Owner Info */}
            {property.owner && (
              <div className="bg-white p-6 rounded-lg border border-gray-100">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Hosted by</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-lg font-medium text-red-600">
                        {property.owner.fullName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{property.owner.fullName || 'Property Owner'}</p>
                      <p className="text-sm text-gray-500">Host</p>
                    </div>
                  </div>
                  
                  {!isOwner && (
                    <button
                      onClick={handleContactHost}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Contact Host
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <div className="mb-4">
                <span className="text-2xl font-light text-gray-900">${safeMonthlyPrice.toLocaleString()}</span>
                <span className="text-gray-500">/month</span>
              </div>

              {bookingStep === 'details' && (
                <div className="space-y-4">
                  {/* Date Picker Button */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dates</label>
                    <button
                      onClick={() => setShowDatePicker(true)}
                      className="w-full border border-gray-200 rounded-lg p-3 text-left hover:border-red-300 transition"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          {checkIn && checkOut 
                            ? `${formatDate(checkIn)} - ${formatDate(checkOut)}`
                            : "Select your dates"}
                        </span>
                      </div>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'guest' : 'guests'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleCheckAvailability}
                    disabled={checkingAvailability || !checkIn || !checkOut}
                    className={`w-full py-3 rounded-lg transition font-medium ${
                      checkingAvailability || !checkIn || !checkOut
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {checkingAvailability ? 'Checking availability...' : 'Check Availability'}
                  </button>
                </div>
              )}

              {bookingStep === 'payment' && availabilityResult?.eligible && (
                <div className="space-y-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-green-700 text-sm">✓ {availabilityResult.message || "Property is available for your dates!"}</p>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Price breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">${availabilityResult.price?.dailyRate?.toFixed(2)} x {availabilityResult.price?.nights} nights</span>
                        <span className="text-gray-900">${availabilityResult.price?.total?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-100">
                        <span className="font-medium text-gray-900">Total (USD)</span>
                        <span className="font-semibold text-red-600">${availabilityResult.price?.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToPayment}
                    className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Proceed to Payment
                  </button>

                  <button
                    onClick={() => {
                      setBookingStep('details');
                      setAvailabilityResult(null);
                    }}
                    className="w-full text-gray-500 text-sm hover:text-gray-700"
                  >
                    Change dates
                  </button>
                </div>
              )}

              {bookingStep === 'payment' && !availabilityResult?.eligible && (
                <div className="text-center py-4">
                  <p className="text-red-500 mb-2">{availabilityResult?.message || "Not available for selected dates"}</p>
                  <button
                    onClick={() => {
                      setBookingStep('details');
                      setAvailabilityResult(null);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Try different dates
                  </button>
                </div>
              )}

              {isOwner && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition mb-2"
                  >
                    Edit Property
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this property?")) {
                        await deleteProperty(propertyId!);
                        router.push("/");
                      }
                    }}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                  >
                    Delete Property
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Picker Modal - Highest z-index to appear above everything */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[2000]">
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onCheckInChange={setCheckIn}
            onCheckOutChange={setCheckOut}
            onClose={() => setShowDatePicker(false)}
          />
        </div>
      )}
    </main>
  );
}