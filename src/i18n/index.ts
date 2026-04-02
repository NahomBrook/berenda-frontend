// frontend/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      "nav.home": "Home",
      "nav.properties": "Properties",
      "nav.bookings": "My Bookings",
      "nav.host": "Become a Host",
      "nav.profile": "Profile",
      "nav.login": "Login",
      "nav.register": "Register",
      "nav.logout": "Logout",
      "nav.dashboard": "Dashboard",
      
      // Common
      "common.loading": "Loading...",
      "common.error": "Error",
      "common.success": "Success",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.delete": "Delete",
      "common.edit": "Edit",
      "common.view": "View",
      "common.search": "Search",
      "common.filter": "Filter",
      "common.reset": "Reset",
      "common.apply": "Apply",
      "common.close": "Close",
      "common.back": "Back",
      "common.next": "Next",
      "common.submit": "Submit",
      "common.confirm": "Confirm",
      
      // Properties
      "properties.title": "Find Your Perfect Property",
      "properties.subtitle": "Discover amazing places in Addis Ababa",
      "properties.search.placeholder": "Search by location, property name...",
      "properties.price": "Price per month",
      "properties.bedrooms": "Bedrooms",
      "properties.bathrooms": "Bathrooms",
      "properties.size": "Size",
      "properties.location": "Location",
      "properties.amenities": "Amenities",
      "properties.description": "Description",
      "properties.book": "Book Now",
      "properties.available": "Available",
      "properties.unavailable": "Not Available",
      "properties.viewDetails": "View Details",
      
      // Bookings
      "bookings.title": "My Bookings",
      "bookings.noBookings": "No bookings yet",
      "bookings.checkIn": "Check-in",
      "bookings.checkOut": "Check-out",
      "bookings.guests": "Guests",
      "bookings.total": "Total Price",
      "bookings.status": "Status",
      "bookings.cancel": "Cancel Booking",
      "bookings.confirm": "Confirm Booking",
      "bookings.pending": "Pending",
      "bookings.confirmed": "Confirmed",
      "bookings.cancelled": "Cancelled",
      "bookings.completed": "Completed",
      
      // Host Dashboard
      "host.title": "Host Dashboard",
      "host.properties": "My Properties",
      "host.addProperty": "Add New Property",
      "host.editProperty": "Edit Property",
      "host.deleteProperty": "Delete Property",
      "host.earnings": "Earnings",
      "host.bookings": "Bookings",
      "host.analytics": "Analytics",
      
      // Auth
      "auth.login.title": "Login to Your Account",
      "auth.login.email": "Email Address",
      "auth.login.password": "Password",
      "auth.login.button": "Login",
      "auth.login.forgot": "Forgot Password?",
      "auth.login.noAccount": "Don't have an account?",
      "auth.register.title": "Create an Account",
      "auth.register.fullName": "Full Name",
      "auth.register.email": "Email Address",
      "auth.register.password": "Password",
      "auth.register.confirmPassword": "Confirm Password",
      "auth.register.button": "Register",
      "auth.register.haveAccount": "Already have an account?",
      
      // AI Chat
      "ai.title": "AI Assistant",
      "ai.subtitle": "Always here to help",
      "ai.placeholder": "Ask me anything...",
      "ai.tip": "💡 Try asking about properties, bookings, or hosting",
      "ai.clear": "Clear",
      "ai.typing": "Assistant is typing...",
      "ai.welcome": "👋 **Hello!** I'm your Berenda AI Assistant.\n\nI can help you find properties, make bookings, answer questions about hosting, and more!\n\nWhat would you like to know?",
      "ai.error": "Sorry, I'm having trouble connecting. Please try again later.",
      
      // Footer
      "footer.about": "About Berenda",
      "footer.contact": "Contact Us",
      "footer.privacy": "Privacy Policy",
      "footer.terms": "Terms of Service",
      "footer.copyright": "© 2024 Berenda. All rights reserved.",
      
      // Languages
      "language.english": "English",
      "language.amharic": "አማርኛ"
    }
  },
  am: {
    translation: {
      // Navigation
      "nav.home": "መነሻ",
      "nav.properties": "ንብረቶች",
      "nav.bookings": "ቦኪንጎቼ",
      "nav.host": "አስተናጋጅ ሁን",
      "nav.profile": "መገለጫ",
      "nav.login": "ግባ",
      "nav.register": "ተመዝገብ",
      "nav.logout": "ውጣ",
      "nav.dashboard": "ዳሽቦርድ",
      
      // Common
      "common.loading": "በመጫን ላይ...",
      "common.error": "ስህተት",
      "common.success": "ተሳክቷል",
      "common.save": "አስቀምጥ",
      "common.cancel": "ሰርዝ",
      "common.delete": "ሰርዝ",
      "common.edit": "አርትዕ",
      "common.view": "አሳይ",
      "common.search": "ፈልግ",
      "common.filter": "አጣራ",
      "common.reset": "ዳግም አስጀምር",
      "common.apply": "ተግብር",
      "common.close": "ዝጋ",
      "common.back": "ተመለስ",
      "common.next": "ቀጥል",
      "common.submit": "አስገባ",
      "common.confirm": "አረጋግጥ",
      
      // Properties
      "properties.title": "ተስማሚ ንብረትህን ፈልግ",
      "properties.subtitle": "በአዲስ አበባ ውስጥ አስደናቂ ቦታዎችን አግኝ",
      "properties.search.placeholder": "በአካባቢ፣ በንብረት ስም ፈልግ...",
      "properties.price": "ዋጋ በወር",
      "properties.bedrooms": "መኝታ ክፍል",
      "properties.bathrooms": "መታጠቢያ ቤት",
      "properties.size": "መጠን",
      "properties.location": "አካባቢ",
      "properties.amenities": "አገልግሎቶች",
      "properties.description": "መግለጫ",
      "properties.book": "አሁን ቦኪንግ አድርግ",
      "properties.available": "ይገኛል",
      "properties.unavailable": "አይገኝም",
      "properties.viewDetails": "ዝርዝር ሁኔታዎችን ተመልከት",
      
      // Bookings
      "bookings.title": "ቦኪንጎቼ",
      "bookings.noBookings": "እስካሁን ምንም ቦኪንግ የለም",
      "bookings.checkIn": "የሚገቡበት ቀን",
      "bookings.checkOut": "የሚወጡበት ቀን",
      "bookings.guests": "እንግዶች",
      "bookings.total": "ጠቅላላ ዋጋ",
      "bookings.status": "ሁኔታ",
      "bookings.cancel": "ቦኪንግ ሰርዝ",
      "bookings.confirm": "ቦኪንግ አረጋግጥ",
      "bookings.pending": "በመጠባበቅ ላይ",
      "bookings.confirmed": "የተረጋገጠ",
      "bookings.cancelled": "የተሰረዘ",
      "bookings.completed": "ተጠናቋል",
      
      // Host Dashboard
      "host.title": "የአስተናጋጅ ዳሽቦርድ",
      "host.properties": "ንብረቶቼ",
      "host.addProperty": "አዲስ ንብረት ጨምር",
      "host.editProperty": "ንብረት አርትዕ",
      "host.deleteProperty": "ንብረት ሰርዝ",
      "host.earnings": "ገቢ",
      "host.bookings": "ቦኪንጎች",
      "host.analytics": "ትንታኔ",
      
      // Auth
      "auth.login.title": "ወደ መለያዎ ይግቡ",
      "auth.login.email": "ኢሜይል አድራሻ",
      "auth.login.password": "የይለፍ ቃል",
      "auth.login.button": "ግባ",
      "auth.login.forgot": "የይለፍ ቃል ረሳሁት?",
      "auth.login.noAccount": "መለያ የለህም?",
      "auth.register.title": "መለያ ፍጠር",
      "auth.register.fullName": "ሙሉ ስም",
      "auth.register.email": "ኢሜይል አድራሻ",
      "auth.register.password": "የይለፍ ቃል",
      "auth.register.confirmPassword": "የይለፍ ቃል አረጋግጥ",
      "auth.register.button": "ተመዝገብ",
      "auth.register.haveAccount": "መለያ አለህ?",
      
      // AI Chat
      "ai.title": "ኤአይ ረዳት",
      "ai.subtitle": "ሁልጊዜ ለመርዳት ዝግጁ",
      "ai.placeholder": "ማንኛውንም ነገር ጠይቀኝ...",
      "ai.tip": "💡 ስለ ንብረቶች፣ ቦኪንግ ወይም ሆስቲንግ ለመጠየቅ ሞክር",
      "ai.clear": "አጽዳ",
      "ai.typing": "ረዳት እየጻፈ ነው...",
      "ai.welcome": "👋 **ሰላም!** እኔ የቤረንዳ ኤአይ ረዳት ነኝ።\n\nንብረቶችን ለማግኘት፣ ቦኪንግ ለማድረግ፣ ስለ ሆስቲንግ ጥያቄዎችን ለመመለስ እና ሌሎችንም ላግዝህ እችላለሁ!\n\nምን መርዳት ትፈልጋለህ?",
      "ai.error": "ይቅርታ፣ ለመገናኘት ችግር አጋጥሞኛል። እባክህ ቆይተህ እንደገና ሞክር።",
      
      // Footer
      "footer.about": "ስለ ቤረንዳ",
      "footer.contact": "አግኙን",
      "footer.privacy": "የግላዊነት ፖሊሲ",
      "footer.terms": "የአገልግሎት ውሎች",
      "footer.copyright": "© 2024 ቤረንዳ። ሁሉም መብቶች ተጠብቀዋል።",
      
      // Languages
      "language.english": "English",
      "language.amharic": "አማርኛ"
    }
  }
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;