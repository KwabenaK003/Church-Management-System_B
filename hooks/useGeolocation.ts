"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getCurrentPosition,
  getGeolocationErrorMessage,
  getGeolocationPermissionState,
  type GeolocationPermissionState,
} from "@/lib/geolocation";

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [permissionState, setPermissionState] =
    useState<GeolocationPermissionState>("unsupported");

  const refreshPermissionState = useCallback(async () => {
    const nextPermissionState = await getGeolocationPermissionState();
    setPermissionState(nextPermissionState);
    return nextPermissionState;
  }, []);

  const requestPosition = useCallback(async (options?: PositionOptions) => {
    setLoading(true);
    setError(undefined);

    try {
      const nextPosition = await getCurrentPosition(options);
      setPosition(nextPosition);
      await refreshPermissionState();
      return nextPosition;
    } catch (requestError) {
      const message = getGeolocationErrorMessage(requestError);
      setPosition(null);
      setError(message);
      await refreshPermissionState();
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [refreshPermissionState]);

  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  useEffect(() => {
    void refreshPermissionState();
  }, [refreshPermissionState]);

  return {
    position,
    loading,
    error,
    permissionState,
    requestPosition,
    clearError,
    refreshPermissionState,
  };
}
