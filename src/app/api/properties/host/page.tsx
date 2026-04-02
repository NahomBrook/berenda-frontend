"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createProperty, uploadPropertyImages } from "../../../../utils/api";

export default function HostPropertyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) router.push("/auth/login");
    else setUser(JSON.parse(storedUser));
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location || !monthlyPrice || !description) {
      setMessage("Please fill in all fields.");
      return;
    }

    try {
      // Create property
      const propertyData = { title, location, monthlyPrice, description };
      const newProperty = await createProperty(propertyData);

      // Upload images if any
      if (files.length > 0) await uploadPropertyImages(newProperty.id, files);

      setMessage("Property submitted successfully!");
      setTitle("");
      setLocation("");
      setMonthlyPrice("");
      setDescription("");
      setFiles([]);
      router.push(`/properties/${newProperty.id}`);
    } catch (err: any) {
      setMessage(err.message || "Failed to create property.");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6 border rounded-md shadow-md">
      <h1 className="text-2xl font-bold mb-6">Host a Property</h1>
      {message && <p className="mb-4 text-red-500">{message}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <input
          type="number"
          placeholder="Monthly Price"
          value={monthlyPrice}
          onChange={(e) => setMonthlyPrice(Number(e.target.value))}
          className="border px-3 py-2 rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <input type="file" multiple onChange={handleFileChange} />
        <button
          type="submit"
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Submit Property
        </button>
      </form>
    </div>
  );
}