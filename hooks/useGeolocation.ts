"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const requestIdRef = useRef(0);

  const refreshPermissionState = useCallback(async () => {
    const nextPermissionState = await getGeolocationPermissionState();
    setPermissionState(nextPermissionState);
    return nextPermissionState;
  }, []);

  const requestPosition = useCallback(async (options?: PositionOptions) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(undefined);

    try {
      const nextPosition = await getCurrentPosition(options);
      if (requestId === requestIdRef.current) {
        setPosition(nextPosition);
      }
      await refreshPermissionState();
      return nextPosition;
    } catch (requestError) {
      const message = getGeolocationErrorMessage(requestError);
      if (requestId === requestIdRef.current) {
        setError(message);
      }
      await refreshPermissionState();
      throw requestError instanceof Error ? requestError : new Error(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [refreshPermissionState]);

  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  useEffect(() => {
    void refreshPermissionState();
  }, [refreshPermissionState]);

  useEffect(() => {
    if (typeof window === "undefined" || !("permissions" in navigator)) {
      return;
    }

    let isActive = true;
    let permissionStatus: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      if (!isActive) {
        return;
      }

      void refreshPermissionState();
    };

    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (!isActive) {
          return;
        }

        permissionStatus = status;
        permissionStatus.addEventListener("change", handlePermissionChange);
      })
      .catch(() => {
        // Browsers that do not support the permissions API still support geolocation requests.
      });

    return () => {
      isActive = false;
      permissionStatus?.removeEventListener("change", handlePermissionChange);
    };
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
