"use client";

import { useCallback, useState } from "react";

import {
  getCurrentPosition,
  getGeolocationErrorMessage,
} from "@/lib/geolocation";

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const requestPosition = useCallback(async (options?: PositionOptions) => {
    setLoading(true);
    setError(undefined);

    try {
      const nextPosition = await getCurrentPosition(options);
      setPosition(nextPosition);
      return nextPosition;
    } catch (requestError) {
      const message = getGeolocationErrorMessage(requestError);
      setPosition(null);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  return {
    position,
    loading,
    error,
    requestPosition,
    clearError,
  };
}
