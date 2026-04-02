// /app/profile/components/ProfileForm.tsx
import { useState } from "react";

interface Props {
  user: any;
  setUser: (u: any) => void;
}

export default function ProfileForm({ user, setUser }: Props) {
  const [form, setForm] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      // Call your update API here
      // Example: await updateUser(form);

      const updatedUser = { ...user, ...form }; // temporary
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setMessage("Profile updated successfully!");
    } catch (err: any) {
      setMessage(err.message || "Update failed");
    }
  };

  return (
    <div className="mb-6 p-4 border rounded-md">
      {message && <p className="text-green-500 mb-2">{message}</p>}
      <div className="flex flex-col gap-4">
        <input
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
          placeholder="Full Name"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
          placeholder="Email"
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
          placeholder="Phone"
        />
        <button
          onClick={handleSave}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}