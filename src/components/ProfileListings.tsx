// /app/profile/components/ProfileListings.tsx
import { useEffect, useState } from "react";
import { getProperties } from "../utils/api";
import { useRouter } from "next/navigation";

interface Property {
  id: string;
  title: string;
  location: string;
  monthlyPrice: number;
  media: { url: string }[];
}

interface Props {
  userId: string;
}

export default function ProfileListings({ userId }: Props) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getProperties();
        setProperties(data.data.filter((p: any) => p.ownerId === userId));
      } catch (err) {
        console.error(err);
      }
    };
    fetchProperties();
  }, [userId]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Your Properties</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {properties.map((p) => (
          <div
            key={p.id}
            className="border rounded-lg cursor-pointer hover:shadow-md overflow-hidden"
            onClick={() => router.push(`/properties/${p.id}`)}
          >
            <img
              src={p.media?.[0]?.url || "/placeholder.png"}
              alt={p.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-2">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-gray-500">{p.location}</p>
              <p className="text-red-500 font-semibold">${p.monthlyPrice}/month</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}