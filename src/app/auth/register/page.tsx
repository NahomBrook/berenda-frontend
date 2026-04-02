"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Navbar from "../../../components/layout/NavBar";
import { registerUser } from "../../../utils/api";
import { API_BASE_URL } from "@/utils/api";
import { useLanguage } from "@/context/LanguageContext";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle redirect after successful registration/login
  const handleRedirect = useCallback((user: any) => {
    const isAdmin = user.roles?.some(
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
    const idToken = response?.credential;
    if (!idToken) {
      setError("Google authentication failed");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      
      const result = await res.json();
      console.log("Google auth response:", result);
      
      if (!res.ok) {
        throw new Error(result.message || "Google authentication failed");
      }
      
      if (result.status === 200 && result.data) {
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));
        handleRedirect(result.data.user);
      }
    } catch (err: any) {
      console.error("Google auth error:", err);
      setError(err?.message || "Google authentication failed");
    } finally {
      setLoading(false);
    }
  }, [router, handleRedirect]);

  // Initialize Google Sign-In
  const initializeGoogle = useCallback(() => {
    const google = (window as any).google;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (google && google.accounts && google.accounts.id && clientId) {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
      });
      
      // Render the Google button
      const buttonElement = document.getElementById("google-signin-button");
      if (buttonElement) {
        google.accounts.id.renderButton(buttonElement, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
        });
      }
    }
  }, [handleGoogleCallback]);

  // Handle email/password registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError(t("auth.register.termsMissing") || "You must agree to terms and conditions.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await registerUser(fullName, email, password);
      console.log("Register response:", response);
      
      let user = response;
      let token = response.token;
      
      if (response.data) {
        user = response.data.user;
        token = response.data.token;
      } else if (response.user) {
        user = response.user;
        token = response.token;
      }
      
      if (user && token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        handleRedirect(user);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
      />
      
      <Navbar />
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-3xl font-bold mb-6 text-center">
            {t("auth.register.title") || "Create an Account"}
          </h2>
          
          {error && (
            <p className="text-red-500 mb-4 text-sm bg-red-50 p-2 rounded border border-red-100">
              {error}
            </p>
          )}

          <input
            type="text"
            placeholder={t("auth.register.fullName") || "Full Name"}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-400"
            required
            disabled={loading}
          />
          
          <input
            type="email"
            placeholder={t("auth.register.email") || "Email"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-400"
            required
            disabled={loading}
          />
          
          <input
            type="password"
            placeholder={t("auth.register.password") || "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-400"
            required
            disabled={loading}
          />

          <label className="flex items-center mb-6">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={() => setAgreeTerms(!agreeTerms)}
              className="mr-2"
              disabled={loading}
            />
            {t("auth.register.agree") || "I agree to the Terms & Conditions"}
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition disabled:opacity-50"
          >
            {loading ? "Registering..." : t("auth.register.button") || "Register"}
          </button>

          <div className="mt-6">
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-sm font-medium">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            {/* Google Sign-In Button */}
            <div id="google-signin-button" className="w-full flex justify-center mt-2"></div>
          </div>

          <p className="mt-4 text-center text-gray-600">
            Already have an account?{" "}
            <span
              className="text-red-500 cursor-pointer hover:underline"
              onClick={() => router.push("/auth/login")}
            >
              {t("auth.login.button") || "Login"}
            </span>
          </p>
        </form>
      </div>
    </>
  );
}
