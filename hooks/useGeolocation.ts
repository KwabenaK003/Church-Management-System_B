"use client";

import { useEffect, useState } from "react";
import { getCurrentPosition } from "@/lib/geolocation";

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentPosition()
      .then((pos) => setPosition(pos))
      .finally(() => setLoading(false));
  }, []);

  return { position, loading };
}
