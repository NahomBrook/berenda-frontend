"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-semibold">Something went wrong.</h2>

      <button
        className="mt-4 px-4 py-2 bg-black text-white rounded"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}