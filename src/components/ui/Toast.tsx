"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "info" | "success" | "error";
  onClose?: () => void;
}

export default function Toast({ message, type = "info", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-gray-700";

  return (
    <div className={`fixed right-6 bottom-6 z-50 ${bg} text-white px-4 py-2 rounded shadow-lg`}> 
      {message}
    </div>
  );
}
