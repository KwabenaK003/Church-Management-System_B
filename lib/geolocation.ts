type PositionLike = GeolocationPosition;

export async function getCurrentPosition(options?: PositionOptions): Promise<PositionLike | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),
      options
    );
  });
}
