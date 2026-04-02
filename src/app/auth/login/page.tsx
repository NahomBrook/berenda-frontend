"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Navbar from "../../../components/layout/NavBar";
import { loginUser } from "../../../utils/api";
import { useLanguage } from "@/context/LanguageContext";
import { API_BASE_URL } from "@/utils/api";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleInitialized, setGoogleInitialized] = useState(false);

  // Handle redirect based on user role
  const handleRedirect = useCallback((user: any) => {
    console.log("User from login:", user);
    
    const isAdmin = user?.roles?.some(
      (r: any) => r.name === "ADMIN" || r.name === "SUPER_ADMIN"
    );
    
    if (isAdmin) {
      router.push("/admin");
    } else {
      router.push("/");
    }
  }, [router]);

  // Handle Google OAuth callback
  const handleGoogleCallback = useCallback(async (response: any) => {
    console.log("🔑 Google callback received:", response);
    
    const idToken = response?.credential;
    if (!idToken) {
      console.error("❌ No credential in Google response");
      setError("Google authentication failed");
      return;
    }
    
    console.log("✅ ID Token received (first 20 chars):", idToken.substring(0, 20));
    setLoading(true);
    
    try {
      console.log("📡 Sending token to backend:", `${API_BASE_URL}/auth/google`);
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      
      const result = await res.json();
      console.log("Google login response:", result);
      
      if (!res.ok) throw new Error(result.message || "Google login failed");
      
      if (result.status === 200 && result.data) {
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));
        handleRedirect(result.data.user);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [router, t, handleRedirect]);

  // Initialize Google
  const initializeGoogle = useCallback(() => {
    const google = (window as any).google;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    console.log("🔧 Initializing Google...");
    console.log("Google object exists:", !!google);
    console.log("Client ID:", clientId);
    
    if (google && google.accounts && google.accounts.id && clientId) {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
      });
      
      const buttonElement = document.getElementById("g_id_signin");
      console.log("Button element found:", !!buttonElement);
      
      if (buttonElement) {
        google.accounts.id.renderButton(buttonElement, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
        });
        setGoogleInitialized(true);
        console.log("✅ Google button rendered");
      } else {
        console.error("❌ Button element 'g_id_signin' not found");
      }
    } else {
      console.error("❌ Google or clientId missing");
      if (!google) console.error("  - google object missing");
      if (!clientId) console.error("  - clientId missing");
    }
  }, [handleGoogleCallback]);

  // Fallback initialization
  useEffect(() => {
    if (!googleInitialized) {
      const timer = setTimeout(() => {
        const google = (window as any).google;
        if (google && !googleInitialized) {
          console.log("🔄 Fallback: Initializing Google");
          initializeGoogle();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [initializeGoogle, googleInitialized]);

  // Handle email/password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      console.log("Login successful, user:", user);
      
      if (user) {
        handleRedirect(user);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("📚 Google script loaded");
          initializeGoogle();
        }}
        onError={() => console.error("❌ Google script failed to load")}
      />

      <Navbar />
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-3xl font-bold mb-6 text-center">{t("auth.login.title")}</h2>
          
          {error && (
            <p className="text-red-500 mb-4 text-sm bg-red-50 p-2 rounded border border-red-100">
              {error}
            </p>
          )}

          <input
            type="email"
            placeholder={t("auth.login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-400 text-black"
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder={t("auth.login.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-6 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-400 text-black"
            required
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition font-semibold disabled:opacity-50"
          >
            {loading ? "Logging in..." : t("auth.login.button")}
          </button>

          <div className="mt-6">
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <div id="g_id_signin" className="w-full flex justify-center mt-2"></div>
          </div>

          <p className="mt-6 text-center text-gray-600 text-sm">
            {t("auth.no_account") || "New here?"}{" "}
            <span
              className="text-red-500 cursor-pointer hover:underline font-medium"
              onClick={() => router.push("/auth/register")}
            >
              {t("auth.register.button")}
            </span>
          </p>
        </form>
      </div>
    </>
  );
}