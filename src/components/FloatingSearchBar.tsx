// components/FloatingSearchBar.tsx
"use client";

import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FloatingSearchBarProps {
  onClick: () => void;
}

export default function FloatingSearchBar({ onClick }: FloatingSearchBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show floating bar when scrolled down more than 200px
      if (currentScrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      // Hide when scrolling up quickly (optional)
      if (currentScrollY < lastScrollY && currentScrollY > 200) {
        // Scrolling up, keep visible
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Search Button (Minimized) */}
      <div
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
          isExpanded ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-white rounded-full shadow-lg border px-4 py-2 flex items-center gap-3 hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Search className="w-5 h-5 text-red-500" />
          <span className="text-gray-600 text-sm font-medium">Search for stays...</span>
          <div className="w-px h-4 bg-gray-300" />
          <span className="text-gray-400 text-xs">Anywhere</span>
        </button>
      </div>

      {/* Expanded Search Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 absolute top-20 left-1/2 transform -translate-x-1/2 animate-slideDown">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Search for stays</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <button
                onClick={() => {
                  setIsExpanded(false);
                  onClick();
                }}
                className="w-full bg-red-500 text-white rounded-full py-3 px-6 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search properties
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">
                Click to open the full search bar
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}