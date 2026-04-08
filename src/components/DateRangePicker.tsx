// components/DateRangePicker.tsx
"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay } from "date-fns";
import { useLanguage } from "@/context/LanguageContext";

// Ethiopian calendar months (12 months of 30 days + 1 short month)
const ET_MONTHS_EN = [
  "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
  "Megabit", "Miyazya", "Gnbot", "Sene", "Hamle", "Nehase", "Pagume"
];
const ET_MONTHS_AM = [
  "መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ", "ጥር", "የካቲት",
  "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሃሴ", "ጳጉሜ"
];

/**
 * Convert a Gregorian Date to Ethiopian calendar.
 * Ethiopian calendar is approximately 7 years and 8 months behind Gregorian.
 * Algorithm: Julian Day Number based conversion.
 */
function gregorianToEthiopian(date: Date): { year: number; month: number; day: number } {
  const jdn = gregorianToJDN(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return jdnToEthiopian(jdn);
}

function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function jdnToEthiopian(jdn: number): { year: number; month: number; day: number } {
  // Ethiopian epoch JDN = 1724221 (Meskerem 1, 1 EC = Aug 29, 8 AD Julian)
  const r = (jdn - 1724221) % 1461;
  const n = r % 365 + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - 1724221) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month: Math.min(month, 13), day };
}

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  onClose: () => void;
}

export function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  onClose,
}: DateRangePickerProps) {
  const { language, t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarType, setCalendarType] = useState<"gregorian" | "ethiopian">("gregorian");
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | null>(checkIn);
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | null>(checkOut);
  const [isSelectingCheckOut, setIsSelectingCheckOut] = useState(false);
  const [animateDate, setAnimateDate] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCheckIn) {
      setAnimateDate("checkin");
      const timer = setTimeout(() => setAnimateDate(null), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedCheckIn]);

  useEffect(() => {
    if (selectedCheckOut) {
      setAnimateDate("checkout");
      const timer = setTimeout(() => setAnimateDate(null), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedCheckOut]);

  const handleDateClick = (date: Date) => {
    if (!selectedCheckIn) {
      setSelectedCheckIn(date);
      setSelectedCheckOut(null);
      setIsSelectingCheckOut(true);

      setTimeout(() => {
        const checkOutSection = document.querySelector('.checkout-section');
        if (checkOutSection) {
          checkOutSection.classList.add('animate-pulse');
          setTimeout(() => checkOutSection.classList.remove('animate-pulse'), 1000);
        }
      }, 100);
    } else if (selectedCheckIn && !selectedCheckOut) {
      if (date < selectedCheckIn) {
        setSelectedCheckIn(date);
        setSelectedCheckOut(selectedCheckIn);
      } else {
        setSelectedCheckOut(date);
        setIsSelectingCheckOut(false);
      }
    } else if (selectedCheckIn && selectedCheckOut) {
      setSelectedCheckIn(date);
      setSelectedCheckOut(null);
      setIsSelectingCheckOut(true);
    }
  };

  const handleApply = () => {
    onCheckInChange(selectedCheckIn);
    onCheckOutChange(selectedCheckOut);
    onClose();
  };

  const handleClear = () => {
    setSelectedCheckIn(null);
    setSelectedCheckOut(null);
    setIsSelectingCheckOut(false);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const startDayOfWeek = start.getDay();
    const paddingDays = Array(startDayOfWeek).fill(null);
    return [...paddingDays, ...days];
  };

  const isInRange = (date: Date) => {
    if (!selectedCheckIn || !selectedCheckOut) return false;
    return date > selectedCheckIn && date < selectedCheckOut;
  };

  const isSelected = (date: Date) => {
    return (selectedCheckIn && isSameDay(date, selectedCheckIn)) ||
           (selectedCheckOut && isSameDay(date, selectedCheckOut));
  };

  const isDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const getMonthDisplay = () => {
    if (calendarType === "gregorian") {
      return format(currentMonth, "MMMM yyyy");
    } else {
      // Show the Ethiopian month that corresponds to most days in this Gregorian month
      const midMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15);
      const et = gregorianToEthiopian(midMonth);
      const monthNames = language === "am" ? ET_MONTHS_AM : ET_MONTHS_EN;
      const monthName = monthNames[et.month - 1] || monthNames[0];
      return `${monthName} ${et.year}`;
    }
  };

  const getDayDisplay = (date: Date) => {
    if (calendarType === "ethiopian") {
      const et = gregorianToEthiopian(date);
      return String(et.day);
    }
    return format(date, "d");
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(prev => direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const days = getDaysInMonth();
  const weekDays = calendarType === "gregorian"
    ? ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    : ["እሑ", "ሰኞ", "ማክ", "ረቡ", "ሐሙ", "ዓር", "ቅዳ"];

  const formatDisplayDate = (date: Date) => {
    if (calendarType === "ethiopian") {
      const et = gregorianToEthiopian(date);
      const monthNames = language === "am" ? ET_MONTHS_AM : ET_MONTHS_EN;
      const monthName = monthNames[et.month - 1] || monthNames[0];
      return `${monthName} ${et.day}, ${et.year}`;
    }
    return format(date, "MMM d, yyyy");
  };

  const getDateRangeText = () => {
    if (selectedCheckIn && selectedCheckOut) {
      return `${formatDisplayDate(selectedCheckIn)} - ${formatDisplayDate(selectedCheckOut)}`;
    }
    if (selectedCheckIn) {
      return `${formatDisplayDate(selectedCheckIn)} - ${t("calendar.selectCheckoutPrompt")}`;
    }
    return t("calendar.selectDates");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex gap-3">
            <button
              onClick={() => setCalendarType("gregorian")}
              className={`px-5 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
                calendarType === "gregorian"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("calendar.gregorian")}
            </button>
            <button
              onClick={() => setCalendarType("ethiopian")}
              className={`px-5 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
                calendarType === "ethiopian"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("calendar.ethiopian")}
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Status Bar */}
        <div className="px-6 pt-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className={`flex-1 text-center transition-all duration-300 ${selectedCheckIn ? 'scale-105' : ''}`}>
                <p className="text-xs font-medium text-gray-500 mb-1">{t("calendar.checkIn")}</p>
                <p className={`text-lg font-semibold transition-all duration-300 ${
                  selectedCheckIn ? 'text-red-500 scale-110' : 'text-gray-400'
                }`}>
                  {selectedCheckIn ? formatDisplayDate(selectedCheckIn) : t("calendar.selectDate")}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 animate-pulse" />
              <div className={`flex-1 text-center transition-all duration-300 ${isSelectingCheckOut ? 'scale-105' : ''}`}>
                <p className="text-xs font-medium text-gray-500 mb-1">{t("calendar.checkOut")}</p>
                <p className={`text-lg font-semibold transition-all duration-300 ${
                  selectedCheckOut
                    ? 'text-red-500 scale-110'
                    : isSelectingCheckOut
                      ? 'text-orange-500 animate-pulse'
                      : 'text-gray-400'
                }`}>
                  {selectedCheckOut
                    ? formatDisplayDate(selectedCheckOut)
                    : isSelectingCheckOut
                      ? t("calendar.selectCheckOut")
                      : t("calendar.notSelected")
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h3 className="text-xl font-semibold text-gray-800">{getMonthDisplay()}</h3>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="p-3" />;
              }

              const disabled = isDisabled(day);
              const selected = isSelected(day);
              const inRange = isInRange(day);
              const isStart = selectedCheckIn && isSameDay(day, selectedCheckIn);
              const isEnd = selectedCheckOut && isSameDay(day, selectedCheckOut);
              const isHovered = hoverDate && selectedCheckIn && !selectedCheckOut && day > selectedCheckIn && day < hoverDate;
              const isAnimated = (animateDate === "checkin" && isStart) || (animateDate === "checkout" && isEnd);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !disabled && handleDateClick(day)}
                  onMouseEnter={() => !disabled && setHoverDate(day)}
                  onMouseLeave={() => setHoverDate(null)}
                  disabled={disabled}
                  className={`
                    relative p-3 text-center rounded-full transition-all duration-300
                    ${disabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 cursor-pointer hover:scale-105"}
                    ${selected ? "bg-red-500 text-white hover:bg-red-600 shadow-md scale-105" : ""}
                    ${(inRange || isHovered) && !selected ? "bg-red-50" : ""}
                    ${isStart || isEnd ? "ring-2 ring-red-500 ring-offset-2" : ""}
                    ${isAnimated ? "animate-bounce" : ""}
                  `}
                >
                  <span className="relative z-10 text-sm font-medium">
                    {getDayDisplay(day)}
                  </span>
                  {isStart && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-red-500 font-medium whitespace-nowrap animate-fadeIn">
                      {t("calendar.checkInLabel")}
                    </div>
                  )}
                  {isEnd && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-red-500 font-medium whitespace-nowrap animate-fadeIn">
                      {t("calendar.checkOutLabel")}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Date Range Summary */}
          <div className="mt-8 pt-6 border-t sticky bottom-0 bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 text-sm">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600 font-medium transition-all duration-300">
                  {getDateRangeText()}
                </span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={handleClear}
                  className="flex-1 sm:flex-none px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  {t("calendar.clear")}
                </button>
                <button
                  onClick={handleApply}
                  disabled={!selectedCheckIn || !selectedCheckOut}
                  className={`flex-1 sm:flex-none px-8 py-2 rounded-lg transition-all duration-200 font-medium shadow-md ${
                    selectedCheckIn && selectedCheckOut
                      ? "bg-red-500 text-white hover:bg-red-600 hover:scale-105 cursor-pointer"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {t("calendar.done")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
