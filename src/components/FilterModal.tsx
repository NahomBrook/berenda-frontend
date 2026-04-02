// components/FilterModal.tsx
"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronUp, Home, Wifi, Bed, DollarSign } from "lucide-react";

interface FilterModalProps {
  filters: {
    homeType: string[];
    amenities: string[];
    priceRange: number[];
    bedrooms: number;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

export function FilterModal({ filters, onFiltersChange, onClose }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedSections, setExpandedSections] = useState({
    homeType: true,
    amenities: true,
    priceRange: true,
    bedrooms: true,
  });

  const homeTypes = [
    { value: "Entire home", icon: Home, label: "Entire home" },
    { value: "Private room", icon: Bed, label: "Private room" },
    { value: "Hotel room", icon: Home, label: "Hotel room" },
    { value: "Shared room", icon: Home, label: "Shared room" },
  ];

  const amenitiesList = [
    { value: "WiFi", icon: Wifi },
    { value: "Kitchen", icon: Home },
    { value: "Washer", icon: Home },
    { value: "Dryer", icon: Home },
    { value: "Air conditioning", icon: Home },
    { value: "Heating", icon: Home },
    { value: "Pool", icon: Home },
    { value: "Hot tub", icon: Home },
    { value: "Free parking", icon: Home },
    { value: "EV charger", icon: Home },
    { value: "Pet friendly", icon: Home },
    { value: "TV", icon: Home },
    { value: "Desk", icon: Home },
    { value: "Gym", icon: Home },
    { value: "Beach access", icon: Home },
    { value: "Mountain view", icon: Home },
  ];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const toggleHomeType = (type: string) => {
    setLocalFilters({
      ...localFilters,
      homeType: localFilters.homeType.includes(type)
        ? localFilters.homeType.filter(t => t !== type)
        : [...localFilters.homeType, type],
    });
  };

  const toggleAmenity = (amenity: string) => {
    setLocalFilters({
      ...localFilters,
      amenities: localFilters.amenities.includes(amenity)
        ? localFilters.amenities.filter(a => a !== amenity)
        : [...localFilters.amenities, amenity],
    });
  };

  const handlePriceChange = (min: number, max: number) => {
    setLocalFilters({
      ...localFilters,
      priceRange: [min, max],
    });
  };

  const handleBedroomsChange = (value: number) => {
    setLocalFilters({
      ...localFilters,
      bedrooms: value,
    });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClearAll = () => {
    setLocalFilters({
      homeType: [],
      amenities: [],
      priceRange: [0, 5000],
      bedrooms: 0,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-semibold">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Home Type Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection("homeType")}
              className="flex justify-between items-center w-full p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium">Home type</h3>
              </div>
              {expandedSections.homeType ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.homeType && (
              <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {homeTypes.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => toggleHomeType(value)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      localFilters.homeType.includes(value)
                        ? "border-red-500 bg-red-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${localFilters.homeType.includes(value) ? "text-red-500" : "text-gray-500"}`} />
                    <p className="font-medium">{label}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Range Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection("priceRange")}
              className="flex justify-between items-center w-full p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium">Price range</h3>
              </div>
              {expandedSections.priceRange ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.priceRange && (
              <div className="px-6 pb-6">
                <div className="flex justify-between mb-4">
                  <div className="flex-1 mr-4">
                    <label className="block text-sm text-gray-600 mb-2">Minimum</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={localFilters.priceRange[0]}
                        onChange={(e) => handlePriceChange(parseInt(e.target.value), localFilters.priceRange[1])}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        min={0}
                        max={localFilters.priceRange[1] - 1}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-2">Maximum</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={localFilters.priceRange[1]}
                        onChange={(e) => handlePriceChange(localFilters.priceRange[0], parseInt(e.target.value))}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        min={localFilters.priceRange[0] + 1}
                        max={10000}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="50"
                    value={localFilters.priceRange[0]}
                    onChange={(e) => handlePriceChange(parseInt(e.target.value), localFilters.priceRange[1])}
                    className="w-full mb-2 accent-red-500"
                  />
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="50"
                    value={localFilters.priceRange[1]}
                    onChange={(e) => handlePriceChange(localFilters.priceRange[0], parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>
                <div className="mt-4 text-center text-gray-600">
                  {formatPrice(localFilters.priceRange[0])} - {formatPrice(localFilters.priceRange[1])}
                </div>
              </div>
            )}
          </div>

          {/* Bedrooms Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection("bedrooms")}
              className="flex justify-between items-center w-full p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bed className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium">Bedrooms</h3>
              </div>
              {expandedSections.bedrooms ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.bedrooms && (
              <div className="px-6 pb-6">
                <div className="flex gap-3 flex-wrap">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleBedroomsChange(num)}
                      className={`px-6 py-3 border-2 rounded-full transition-all ${
                        localFilters.bedrooms === num
                          ? "border-red-500 bg-red-50 text-red-500 font-medium shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      {num === 0 ? "Any" : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amenities Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection("amenities")}
              className="flex justify-between items-center w-full p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium">Amenities</h3>
              </div>
              {expandedSections.amenities ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {expandedSections.amenities && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {amenitiesList.map(({ value, icon: Icon }) => (
                    <label
                      key={value}
                      className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Icon className="w-4 h-4 text-gray-500" />
                      <input
                        type="checkbox"
                        checked={localFilters.amenities.includes(value)}
                        onChange={() => toggleAmenity(value)}
                        className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
                      />
                      <span className="text-gray-700 text-sm">{value}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-between bg-gray-50 sticky bottom-0">
          <button
            onClick={handleClearAll}
            className="px-6 py-3 text-gray-600 underline hover:text-gray-800 transition-colors font-medium"
          >
            Clear all
          </button>
          <button
            onClick={handleApply}
            className="px-8 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium shadow-md hover:shadow-lg"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}