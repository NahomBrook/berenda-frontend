// frontend/src/types/property.ts
export interface Property {
  id: string;
  ownerId?: string;
  title: string;
  description?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  monthlyPrice: number;
  isAvailable?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  area?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  media: {
    id?: string;
    url?: string;
    mediaUrl?: string;
    mediaType?: string;
  }[];
  owner?: {
    fullName?: string;
    email?: string;
  };
}