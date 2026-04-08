export interface User {
  id: string;
  email: string;
  fullName: string;
  username: string;
  phone?: string;
  profileImageUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  roles: { name: string }[];
}

export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  monthlyPrice: number;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  area?: number;
  isAvailable: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner?: {
    id: string;
    fullName: string;
    email: string;
    profileImageUrl?: string;
  };
  media: PropertyMedia[];
  amenities?: { amenity: { id: string; name: string } }[];
  reviews?: { rating: number }[];
  averageRating?: number | null;
  reviewsCount?: number;
}

export interface PropertyMedia {
  id: string;
  propertyId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  renterId: string;
  startDate: string;
  endDate: string;
  totalPrice?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'pending_payment' | 'confirmed' | 'failed';
  createdAt: string;
  property?: {
    id: string;
    title: string;
    location: string;
    monthlyPrice: number;
    media?: { mediaUrl: string }[];
  };
}

export interface Chat {
  id: string;
  createdAt: string;
  participant: {
    id: string;
    fullName: string;
    profileImage?: string;
  } | null;
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  } | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  chatId?: string;
  senderId: string;
  message: string;
  createdAt: string;
  isAi: boolean;
  readAt?: string | null;
}

export interface FavoriteProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  imageUrl: string;
  rating: number;
  favoriteId: string;
}

export interface AdminDashboard {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  pendingProperties: number;
  totalRevenue: number;
  recentUsers: User[];
  recentBookings: Booking[];
}
