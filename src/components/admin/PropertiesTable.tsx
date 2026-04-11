"use client";

import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllProperties, approveProperty, rejectProperty, deleteProperty } from "@/utils/adminApi";
import Toast from "@/components/ui/Toast";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

interface Property {
  id: string;
  title: string;
  description?: string;
  location?: string;
  monthlyPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  amenities?: string[];
  approvalStatus: string;
  owner?: { fullName?: string; email?: string };
  media?: { mediaUrl: string; mediaType: string }[];
}

function PropertyDetailModal({
  property,
  onClose,
  onApprove,
  onReject,
  onDelete,
  isPending,
}: {
  property: Property;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const [showReject, setShowReject] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const images = (property.media || []).filter((m) => m.mediaType === "image");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800 truncate pr-4">{property.title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image carousel */}
        {images.length > 0 ? (
          <div className="relative bg-gray-100 h-56 md:h-72">
            <img
              src={images[imgIndex].mediaUrl}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="absolute bottom-2 right-3 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                  {imgIndex + 1} / {images.length}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            No images
          </div>
        )}

        {/* Details */}
        <div className="px-6 py-4 space-y-4">
          {/* Meta row */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            {property.location && <span>📍 {property.location}</span>}
            {property.monthlyPrice && (
              <span className="font-semibold text-gray-800">
                ETB {property.monthlyPrice.toLocaleString()}/mo
              </span>
            )}
            {property.bedrooms != null && <span>🛏 {property.bedrooms} bed</span>}
            {property.bathrooms != null && <span>🚿 {property.bathrooms} bath</span>}
            {property.maxGuests != null && <span>👥 {property.maxGuests} guests</span>}
          </div>

          {/* Owner */}
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Host: </span>
            {property.owner?.fullName || property.owner?.email || "Unknown"}
          </div>

          {/* Description */}
          {property.description && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <span key={a} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Inline reject form */}
          {showReject && (
            <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-yellow-800">Reason for rejection (optional)</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
                className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onReject(rejectReason); setShowReject(false); }}
                  className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600"
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => { setShowReject(false); setRejectReason(""); }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Inline delete confirm */}
          {showDelete && (
            <div className="border border-red-300 bg-red-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-red-800">
                Delete &quot;{property.title}&quot;? The host will be notified. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onDelete(); setShowDelete(false); }}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDelete(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {isPending && !showReject && !showDelete && (
              <>
                <button
                  onClick={onApprove}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600"
                >
                  Reject
                </button>
              </>
            )}
            {!showDelete && !showReject && (
              <button
                onClick={() => setShowDelete(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertiesTable() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" } | null>(null);
  const [selected, setSelected] = useState<Property | null>(null);
  const pendingRef = useRef<Record<string, boolean>>({});

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await getAllProperties(page, statusFilter);
      setProperties(res.data || []);
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to load properties", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    const t = setInterval(fetchProperties, 15000);
    return () => clearInterval(t);
  }, [page, statusFilter]);

  const removeLocally = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
    setSelected(null);
  };

  const handleApprove = async (id: string) => {
    if (pendingRef.current[id]) return;
    pendingRef.current[id] = true;
    removeLocally(id);
    try {
      await approveProperty(id);
      setToast({ msg: "Property approved — host has been notified.", type: "success" });
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to approve", type: "error" });
      fetchProperties();
    } finally {
      pendingRef.current[id] = false;
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    if (pendingRef.current[id]) return;
    pendingRef.current[id] = true;
    removeLocally(id);
    try {
      await rejectProperty(id, reason || undefined);
      setToast({ msg: "Property rejected — host has been notified.", type: "success" });
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to reject", type: "error" });
      fetchProperties();
    } finally {
      pendingRef.current[id] = false;
    }
  };

  const handleDelete = async (id: string) => {
    if (pendingRef.current[id]) return;
    pendingRef.current[id] = true;
    try {
      await deleteProperty(id);
      setToast({ msg: "Property deleted — host has been notified.", type: "success" });
      removeLocally(id);
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to delete", type: "error" });
    } finally {
      pendingRef.current[id] = false;
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {selected && (
        <PropertyDetailModal
          property={selected}
          onClose={() => setSelected(null)}
          onApprove={() => handleApprove(selected.id)}
          onReject={(reason) => handleReject(selected.id, reason)}
          onDelete={() => handleDelete(selected.id)}
          isPending={selected.approvalStatus === "pending"}
        />
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["pending", "all", "approved", "rejected"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 py-6 text-center">Loading properties...</p>
      ) : properties.length === 0 ? (
        <p className="text-gray-400 py-6 text-center">No {statusFilter !== "all" ? statusFilter : ""} properties found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Title</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Owner</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Price (ETB)</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium max-w-[160px] truncate">{p.title}</td>
                  <td className="p-3 text-sm text-gray-600">{p.owner?.fullName || p.owner?.email}</td>
                  <td className="p-3 text-sm text-gray-700">{p.monthlyPrice?.toLocaleString()}</td>
                  <td className="p-3 text-sm">{statusBadge(p.approvalStatus)}</td>
                  <td className="p-3 text-sm">
                    <button
                      onClick={() => setSelected(p)}
                      className="px-3 py-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-700"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Prev</button>
        <span className="px-3 py-1 text-sm text-gray-600">Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1 bg-gray-200 rounded">Next</button>
      </div>
    </div>
  );
}
