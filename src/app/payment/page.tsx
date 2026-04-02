// frontend/src/app/payment/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/utils/api";

export default function PaymentPage({ searchParams }: { searchParams: { bookingId?: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    if (!searchParams.bookingId) {
      setError("No booking selected");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId: searchParams.bookingId }),
      });

      const data = await response.json();

      if (data.success && data.data.checkout_url) {
        // Redirect to Chapa checkout page
        window.location.href = data.data.checkout_url;
      } else {
        setError(data.message || "Failed to initialize payment");
      }
    } catch (err: any) {
      setError(err.message || "Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Complete Payment</h1>
      <p className="text-gray-600 mb-6">
        You will be redirected to Chapa secure payment gateway to complete your transaction.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
      >
        {loading ? "Processing..." : "Proceed to Payment"}
      </button>
      
      <button
        onClick={() => router.back()}
        className="w-full mt-3 text-gray-600 py-2 rounded-lg hover:text-gray-800 transition"
      >
        Cancel
      </button>
    </div>
  );
}