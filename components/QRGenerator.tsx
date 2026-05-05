"use client";

import { useState } from "react";

export default function QRGenerator() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [event,    setEvent]    = useState("");
  const [location, setLocation] = useState("");
  const [qrUrl,    setQrUrl]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Build the registration URL that will be encoded in the QR code
  const registrationUrl = event
    ? `${siteUrl}/register?event=${encodeURIComponent(event)}&location=${encodeURIComponent(location)}`
    : "";

  async function generateQR() {
    if (!event) return;
    setLoading(true);

    // Use the QR server API (no install needed) — replace with python-qrcode output URL in production
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registrationUrl)}`;
    setQrUrl(qrApiUrl);
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate QR Code</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
            <input
              type="text"
              placeholder="e.g. Tech Conference 2025"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
            <input
              type="text"
              placeholder="e.g. Main Hall, Accra"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={generateQR}
            disabled={!event || loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate QR Code"}
          </button>

          {/* Show the URL that will be embedded */}
          {registrationUrl && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1 font-medium">Registration URL:</p>
              <p className="text-xs text-indigo-600 break-all">{registrationUrl}</p>
            </div>
          )}
        </div>

        {/* Right: QR Code Display */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 min-h-48">
          {qrUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
              <a
                href={qrUrl}
                download={`qr-${event}.png`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 text-sm text-indigo-600 hover:underline font-medium"
              >
                Download QR Code
              </a>
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center">
              Fill in the event name and click Generate to see your QR code here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
