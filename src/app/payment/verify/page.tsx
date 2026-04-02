"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/NavBar";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tx_ref = searchParams.get("tx_ref");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    if (!tx_ref) {
      setStatus("failed");
      setMessage("No transaction reference provided.");
      return;
    }

    const verifyTransaction = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/payments/verify/${tx_ref}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          setMessage("Your payment was successful and your booking is confirmed!");
        } else {
          setStatus("failed");
          setMessage(data.message || "Payment verification failed.");
        }
      } catch (err: any) {
        setStatus("failed");
        setMessage("An error occurred during verification.");
      }
    };

    verifyTransaction();
  }, [tx_ref]);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          
          {status === "loading" && (
            <div className="flex flex-col items-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Processing</h2>
              <p className="text-gray-500">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-500 mb-8">{message}</p>
              <button 
                onClick={() => router.push('/profile')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition"
              >
                View My Bookings
              </button>
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
              <p className="text-gray-500 mb-8">{message}</p>
              <button 
                onClick={() => router.push('/')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition"
              >
                Return Home
              </button>
            </div>
          )}
          
        </div>
      </div>
    </main>
  );
}
