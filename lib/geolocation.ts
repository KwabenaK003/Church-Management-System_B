export type GeolocationErrorCode =
  | "unsupported"
  | "insecure_context"
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "unknown";

export type GeolocationPermissionState = PermissionState | "unsupported";

export class GeolocationRequestError extends Error {
  code: GeolocationErrorCode;

  constructor(code: GeolocationErrorCode, message: string) {
    super(message);
    this.name = "GeolocationRequestError";
    this.code = code;
  }
}

function requestCurrentPosition(
  options?: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(mapGeolocationError(error)),
      options,
    );
  });
}

function watchCurrentPositionFallback(
  options?: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    const fallbackTimeout = Math.max(options?.timeout ?? 10000, 5000);
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      navigator.geolocation.clearWatch(watchId);
      callback();
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => finish(() => resolve(position)),
      (error) => finish(() => reject(mapGeolocationError(error))),
      {
        ...options,
        enableHighAccuracy: false,
        maximumAge: Math.max(options?.maximumAge ?? 0, 30000),
      },
    );

    const timeoutId = window.setTimeout(() => {
      finish(() => {
        reject(
          new GeolocationRequestError(
            "timeout",
            "Location request timed out. Please try again.",
          ),
        );
      });
    }, fallbackTimeout);
  });
}

function mapGeolocationError(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return new GeolocationRequestError(
        "permission_denied",
        "Location access was blocked. Allow location in your browser, or re-enable it in site settings if it was previously denied.",
      );
    case error.POSITION_UNAVAILABLE:
      return new GeolocationRequestError(
        "position_unavailable",
        "We could not determine your current location. Please try again.",
      );
    case error.TIMEOUT:
      return new GeolocationRequestError(
        "timeout",
        "Location request timed out. Please try again.",
      );
    default:
      return new GeolocationRequestError(
        "unknown",
        "We could not read your location. Please try again.",
      );
  }
}

export function getGeolocationErrorMessage(error: unknown) {
  if (error instanceof GeolocationRequestError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "We could not read your location. Please try again.";
}

export async function getGeolocationPermissionState(): Promise<GeolocationPermissionState> {
  if (typeof window === "undefined" || !("permissions" in navigator)) {
    return "unsupported";
  }

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "unsupported";
  }
}

export async function getCurrentPosition(
  options?: PositionOptions,
): Promise<GeolocationPosition> {
  if (typeof window === "undefined") {
    throw new GeolocationRequestError(
      "unsupported",
      "Location access is only available in the browser.",
    );
  }

  if (!window.isSecureContext) {
    throw new GeolocationRequestError(
      "insecure_context",
      "Location access requires a secure connection (HTTPS or localhost).",
    );
  }

  if (!navigator.geolocation) {
    throw new GeolocationRequestError(
      "unsupported",
      "This device or browser does not support location access.",
    );
  }

  try {
    return await requestCurrentPosition(options);
  } catch (error) {
    if (
      error instanceof GeolocationRequestError &&
      (error.code === "timeout" || error.code === "position_unavailable")
    ) {
      return watchCurrentPositionFallback(options);
    }

    throw error;
  }
}
