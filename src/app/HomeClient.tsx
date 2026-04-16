"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Heart } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import SearchBar from "@/components/home/SearchBar";
import { propertyAPI, favoritesAPI } from "@/services/api";
import type { Property } from "@/types/property";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  initialProperties: Property[];
}

function parseInitialFilters() {
  if (typeof window === "undefined") {
    return {
      location: "",
      checkIn: null as Date | null,
      checkOut: null as Date | null,
      homeType: [] as string[],
      amenities: [] as string[],
      minPrice: 0,
      maxPrice: 5000,
      bedrooms: 0,
    };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    location: params.get("location") || "",
    checkIn: params.get("checkIn") ? new Date(params.get("checkIn")!) : null,
    checkOut: params.get("checkOut") ? new Date(params.get("checkOut")!) : null,
    homeType: params.get("homeType")?.split(",") || [],
    amenities: params.get("amenities")?.split(",") || [],
    minPrice: parseInt(params.get("minPrice") || "0"),
    maxPrice: parseInt(params.get("maxPrice") || "5000"),
    bedrooms: parseInt(params.get("bedrooms") || "0"),
  };
}

export default function HomeClient({ initialProperties }: Props) {
  const router = useRouter();
  const { t } = useLanguage();

  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [showSearchInNav, setShowSearchInNav] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  // Lazy initializer: reads URL params once on mount (client-only — no useSearchParams needed)
  const [currentFilters, setCurrentFilters] = useState(parseInitialFilters);

  // Load saved favorites for the logged-in user
  useEffect(() => {
    const token = localStorage.getItem("berenda_token");
    if (!token) return;
    favoritesAPI.list().then((res) => {
      const ids: string[] = (res.data?.data || []).map((f: any) => f.propertyId || f.id);
      setFavorites(new Set(ids));
    }).catch(() => {});
  }, []);

  const toggleFavorite = useCallback(async (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();
    const token = localStorage.getItem("berenda_token");
    if (!token) { router.push("/auth/login"); return; }
    const isSaved = favorites.has(propertyId);
    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(propertyId) : next.add(propertyId);
      return next;
    });
    try {
      if (isSaved) {
        await favoritesAPI.remove(propertyId);
      } else {
        await favoritesAPI.add(propertyId);
      }
    } catch {
      // Revert on failure
      setFavorites((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(propertyId) : next.delete(propertyId);
        return next;
      });
    }
  }, [favorites, router]);

  // If server gave us empty properties (build-time fetch failed), fetch client-side
  useEffect(() => {
    if (initialProperties.length === 0) {
      fetchProperties();
    }
    // Only on mount — safe to omit fetchProperties from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If URL has active filters (user navigated with query string), re-fetch with those filters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hasFilters =
      params.get("location") ||
      params.get("checkIn") ||
      params.get("minPrice") ||
      params.get("bedrooms");
    if (hasFilters && initialProperties.length > 0) {
      fetchProperties(currentFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProperties = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      const f = filters || currentFilters;
      const params: Record<string, string | number> = {};
      if (f.location) params.location = f.location;
      if (f.checkIn) params.checkIn = f.checkIn.toISOString();
      if (f.checkOut) params.checkOut = f.checkOut.toISOString();
      if (f.homeType?.length) params.homeType = f.homeType.join(",");
      if (f.amenities?.length) params.amenities = f.amenities.join(",");
      if (f.minPrice) params.minPrice = f.minPrice;
      if (f.maxPrice && f.maxPrice < 5000) params.maxPrice = f.maxPrice;
      if (f.bedrooms) params.bedrooms = f.bedrooms;
      const response = await propertyAPI.list(params);
      const data = response.data?.data || [];
      setProperties(data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  const handleSearch = useCallback((filters: any) => {
    setCurrentFilters(filters);
    fetchProperties(filters);

    const params = new URLSearchParams();
    if (filters.location) params.set("location", filters.location);
    if (filters.checkIn) params.set("checkIn", filters.checkIn?.toISOString() || "");
    if (filters.checkOut) params.set("checkOut", filters.checkOut?.toISOString() || "");
    if (filters.homeType?.length) params.set("homeType", filters.homeType.join(","));
    if (filters.amenities?.length) params.set("amenities", filters.amenities.join(","));
    if (filters.minPrice) params.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice.toString());
    if (filters.bedrooms) params.set("bedrooms", filters.bedrooms.toString());

    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`
    );
  }, [fetchProperties]);

  // Scroll behavior
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > 100;
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
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          const el = document.querySelector(
            'input[placeholder="Search destinations"]'
          ) as HTMLInputElement;
          if (el) el.focus();
        }, 500);
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        const el = document.querySelector(
          'input[placeholder="Search destinations"]'
        ) as HTMLInputElement;
        if (el) el.focus();
      }, 500);
    }
  }, [showSearchBar]);

  const optimizeCloudinaryUrl = (url: string): string => {
    if (!url.includes("res.cloudinary.com")) return url;
    return url.replace("/upload/", "/upload/w_600,q_auto,f_auto/");
  };

  const getPropertyImage = (property: Property): string => {
    if (!property.media || property.media.length === 0) return "/placeholder.png";
    const imageUrl = property.media[0]?.mediaUrl || property.media[0]?.url;
    return imageUrl ? optimizeCloudinaryUrl(imageUrl) : "/placeholder.png";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <Navbar
        onSearchClick={handleSearchClick}
        showSearchButton={showSearchInNav}
      />

      <SearchBar isVisible={showSearchBar} onSearch={handleSearch} />

      <div className="max-w-6xl mx-auto px-4 flex-1 w-full">
        {loading ? (
          <div className="mt-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="border rounded-lg overflow-hidden animate-pulse bg-white"
                >
                  <div className="w-full h-40 sm:h-48 bg-gray-200" />
                  <div className="p-3 sm:p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="mt-8 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => fetchProperties()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t("common.tryAgain")}
              </button>
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t("home.noProperties")}</p>
            <p className="text-gray-400 text-sm mt-2">{t("home.noPropertiesHint")}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600 mt-8">
              {t("home.found")} {properties.length} {t("home.properties")}
              {currentFilters.location && ` in ${currentFilters.location}`}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {properties.map((property, index) => (
                <div
                  key={property.id}
                  className="bg-white border rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
                  onClick={() => router.push(`/listings/${property.id}`)}
                >
                  <div className="relative h-40 sm:h-48 bg-gray-100">
                    <img
                      src={getPropertyImage(property)}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      loading={index < 4 ? "eager" : "lazy"}
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.png";
                      }}
                    />
                    <button
                      onClick={(e) => toggleFavorite(e, property.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors border border-red-200"
                      aria-label={favorites.has(property.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={favorites.has(property.id) ? "#ef4444" : "none"}
                        stroke={favorites.has(property.id) ? "#ef4444" : "#ef4444"}
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h2 className="font-bold text-base sm:text-lg truncate">
                      {property.title}
                    </h2>
                    <p className="text-gray-600 text-sm mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{property.location}</span>
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="text-red-600 font-semibold text-sm sm:text-base">
                        ETB {property.monthlyPrice.toLocaleString()}
                        <span className="text-xs sm:text-sm text-gray-500 font-normal">
                          {t("home.perMonth")}
                        </span>
                      </p>
                      {property.bedrooms && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                          </svg>
                          {property.bedrooms}{" "}
                          {property.bedrooms === 1
                            ? t("home.bed")
                            : t("home.beds")}
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

      <footer className="mt-16 border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>{t("footer.copyright")}</span>
          <div className="flex gap-6">
            <a href="/terms" className="hover:text-red-600 transition-colors">
              {t("footer.terms")}
            </a>
            <a href="/terms#privacy" className="hover:text-red-600 transition-colors">
              {t("footer.privacy")}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
