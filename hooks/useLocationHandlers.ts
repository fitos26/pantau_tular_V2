"use client";

import { LocationService, LocationError } from "../services/LocationService";

export const useLocationHandlers = (
  setShowPopup: (value: boolean) => void,
  setLocationError: (value: LocationError | null) => void,
  onAllowCallback: (latitude: number, longitude: number) => void,
  onDenyCallback: () => void
) => {
  const handleAllow = () => {
    setShowPopup(false);
    console.log("Izin lokasi diberikan.");
    
    LocationService.requestLocation(
        (latitude, longitude) => {
            console.log(`Lokasi berhasil didapatkan: (${latitude}, ${longitude})`);
            onAllowCallback(latitude, longitude);
        },
        (error) => {
            console.error("Gagal mendapatkan lokasi:", error);
            setLocationError(error);
        }
    );
  };

  const handleDeny = () => {
    setShowPopup(false);
    console.log("Izin lokasi ditolak.");
    setLocationError ({
        type: "PERMISSION_DENIED",
        message: "Izin akses lokasi ditolak. Izinkan akses lokasi di pengaturan browser Anda."
    })
    onDenyCallback();
  };

  return { handleAllow, handleDeny };
};