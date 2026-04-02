"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/NavBar";
import { API_BASE_URL } from "@/utils/api";
import { CreditCard, Landmark, Loader2, Phone, Banknote, FileText } from "lucide-react";

type PaymentMethod = "telebirr" | "cbe" | "card" | "bank";

interface BookingDetails {
  propertyId: string;
  propertyTitle?: string;
  propertyLocation?: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  totalPrice?: number;
  total?: number;
}

interface Property {
  id: string;
  title: string;
  location: string;
  monthlyPrice: number;
  media?: Array<{ mediaUrl?: string }>;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("telebirr");

  const showPhone = paymentMethod === "telebirr" || paymentMethod === "cbe";

  const totalAmount = useMemo(() => {
    if (!bookingDetails) return 0;
    const t = bookingDetails.totalPrice ?? bookingDetails.total ?? 0;
    return Number(t);
  }, [bookingDetails]);

  const primaryImageUrl = useMemo(() => {
    const mediaUrl = property?.media?.[0]?.mediaUrl;
    return mediaUrl || "/placeholder.png";
  }, [property]);

  useEffect(() => {
    const details = sessionStorage.getItem("bookingDetails");
    if (details) {
      setBookingDetails(JSON.parse(details));
    } else {
      setError("Missing booking details. Please start booking again.");
    }
  }, []);

  useEffect(() => {
    if (!propertyId) return;
    const loadProperty = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/properties/${propertyId}`);
        const data = await res.json();
        setProperty(data?.data || data);
      } catch {
        // ignore; summary can still render from bookingDetails
      }
    };
    loadProperty();
  }, [propertyId]);

  const handlePay = async () => {
    setError(null);
    if (!bookingDetails) return;
    if (!propertyId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      if (!fullName.trim()) return setError("Full name is required.");
      if (!email.trim()) return setError("Email is required.");
      if (showPhone && !phoneNumber.trim()) return setError("Phone number is required for this payment method.");

      const res = await fetch(`${API_BASE_URL}/payments/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId,
          startDate: bookingDetails.checkIn,
          endDate: bookingDetails.checkOut,
          guests: bookingDetails.guests,
          totalPrice: totalAmount,
          paymentMethod,
          customer: {
            fullName,
            email,
            phoneNumber,
            notes,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Payment initialization failed");

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      throw new Error("Missing checkout URL from payment provider.");
    } catch (e: any) {
      setError(e?.message || "An error occurred while initializing payment.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (s?: string) => {
    if (!s) return "-";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto mt-10 px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-700 hover:text-gray-900 inline-flex items-center gap-2"
            type="button"
          >
            <span className="text-sm">Back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: payment */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h1 className="text-2xl font-light text-gray-900 mb-2">Complete your booking</h1>
              <p className="text-gray-600 mb-5">
                Enter your details and choose a payment method. You will be redirected to Chapa to complete payment.
              </p>

              {error && (
                <div className="mb-5 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
                  {error}
                </div>
              )}

              {/* Customer Information */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Customer information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm text-gray-700">Full name</span>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g., Abebe Tadesse"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-gray-700">Email</span>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="you@example.com"
                      required
                      type="email"
                    />
                  </label>
                </div>

                {showPhone && (
                  <div className="mt-4">
                    <label className="block">
                      <span className="text-sm text-gray-700">Phone number (Telebirr/CBE)</span>
                      <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="e.g., 0912345678"
                        required
                        type="tel"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Use the number registered on your Telebirr/CBE account.
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block">
                    <span className="text-sm text-gray-700">Optional notes</span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[90px]"
                      placeholder="Any special request for the host?"
                    />
                  </label>
                </div>
              </div>

              {/* Payment method selection */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Payment method</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("telebirr")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      paymentMethod === "telebirr" ? "border-red-500 bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <Phone className="w-5 h-5 text-red-600" />
                      <span className="font-semibold">Telebirr</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Ethiopian mobile money</div>
                    <div className="text-xs text-gray-500">
                      Instructions: You will be prompted to confirm payment on your phone.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cbe")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      paymentMethod === "cbe" ? "border-red-500 bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <Banknote className="w-5 h-5 text-red-600" />
                      <span className="font-semibold">CBE Birr</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">CBE mobile banking</div>
                    <div className="text-xs text-gray-500">
                      Instructions: Enter your CBE Birr phone number to authorize payment.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      paymentMethod === "card" ? "border-red-500 bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <CreditCard className="w-5 h-5 text-red-600" />
                      <span className="font-semibold">Card Payment</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Credit / Debit card</div>
                    <div className="text-xs text-gray-500">
                      Instructions: Pay securely via Chapa card checkout.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      paymentMethod === "bank" ? "border-red-500 bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <Landmark className="w-5 h-5 text-red-600" />
                      <span className="font-semibold">Bank Transfer</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Direct bank transfer</div>
                    <div className="text-xs text-gray-500">
                      Instructions: Follow Chapa bank transfer steps to complete payment.
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handlePay}
                  disabled={loading || !!error}
                  className={`w-full text-white py-3 rounded-xl font-medium transition ${
                    loading ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                  }`}
                  type="button"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2 justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Pay with Chapa"
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Payments are securely processed by Chapa.
                </p>
              </div>
            </div>
          </div>

          {/* Right: summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Booking summary</h2>

              {bookingDetails ? (
                <>
                  <div className="rounded-xl overflow-hidden border border-gray-100 mb-4">
                    <img
                      src={primaryImageUrl}
                      alt={property?.title || bookingDetails.propertyTitle || "Property"}
                      className="w-full h-40 object-cover bg-gray-100"
                    />
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center gap-3 border-b pb-3">
                      <span className="text-gray-600">Property</span>
                      <span className="font-medium text-gray-900 text-right">
                        {property?.title || bookingDetails.propertyTitle || "Property"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-3 border-b pb-3">
                      <span className="text-gray-600">Dates</span>
                      <span className="font-medium text-gray-900 text-right">
                        {formatDate(bookingDetails.checkIn)} - {formatDate(bookingDetails.checkOut)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-3 border-b pb-3">
                      <span className="text-gray-600">Guests</span>
                      <span className="font-medium text-gray-900 text-right">{bookingDetails.guests}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-900 font-semibold">Total price</span>
                      <span className="font-bold text-red-600">
                        {Number.isFinite(totalAmount) ? totalAmount.toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-600">No booking details found.</div>
              )}
            </div>

            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition"
            >
              Back to property
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}