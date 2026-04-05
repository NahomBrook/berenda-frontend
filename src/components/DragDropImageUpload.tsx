// frontend/src/components/DragDropImageUpload.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Trash2 } from "lucide-react";

interface DragDropImageUploadProps {
  onImagesChange: (files: File[]) => void;
  imagePreviews: string[];
  onRemoveImage: (index: number) => void;
  maxImages?: number;
  multiple?: boolean;
}

export default function DragDropImageUpload({
  onImagesChange,
  imagePreviews,
  onRemoveImage,
  maxImages = 10,
  multiple = true,
}: DragDropImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: File[]) => {
      const validFiles = files.filter(
        (file) =>
          file.type.startsWith("image/") &&
          file.size <= 10 * 1024 * 1024
      );

      if (validFiles.length === 0) {
        alert("Please upload valid image files (JPG, PNG, WEBP, GIF) under 10MB.");
        return;
      }

      const remainingSlots = maxImages - imagePreviews.length;
      const filesToAdd = validFiles.slice(0, remainingSlots);

      if (filesToAdd.length === 0) {
        alert(`You can only upload up to ${maxImages} images.`);
        return;
      }

      if (validFiles.length > remainingSlots) {
        alert(`Only ${remainingSlots} of ${validFiles.length} images were added. Max ${maxImages} images.`);
      }

      onImagesChange(filesToAdd);
    },
    [imagePreviews.length, maxImages, onImagesChange]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleFiles(files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-red-500 bg-red-50"
            : "border-gray-300 hover:border-red-400 bg-gray-50"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Drag & drop images here</p>
        <p className="text-gray-400 text-sm mt-1">or click to browse</p>
        <p className="text-gray-400 text-xs mt-2">
          Supports JPG, PNG, WEBP, GIF (max 10MB each)
        </p>
        {imagePreviews.length > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            {imagePreviews.length} / {maxImages} images uploaded
          </p>
        )}
      </div>

      {imagePreviews.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Uploaded Images ({imagePreviews.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-28 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  {index + 1}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(index);
                  }}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                    Cover
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            The first image will be used as the cover photo
          </p>
        </div>
      )}
    </div>
  );
}