export type GeolocationErrorCode =
  | "unsupported"
  | "insecure_context"
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "unknown";

export class GeolocationRequestError extends Error {
  code: GeolocationErrorCode;

  constructor(code: GeolocationErrorCode, message: string) {
    super(message);
    this.name = "GeolocationRequestError";
    this.code = code;
  }
}

function mapGeolocationError(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return new GeolocationRequestError(
        "permission_denied",
        "Location access was blocked. Please allow location access to complete check-in.",
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

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(mapGeolocationError(error)),
      options,
    );
  });
}
