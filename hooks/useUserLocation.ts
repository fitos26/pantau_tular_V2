"use client";

import { LocationService, LocationError } from "../services/LocationService";

export const useUserLocation = (
  setShowPopup: (value: boolean) => void,
  setLocationError: (value: LocationError | null) => void,
  onAllowCallback: (latitude: number, longitude: number) => void,
  onDenyCallback: () => void
) => {
  const handleAllow = () => {
    console.log("Pengguna memilih lanjut.");
    
    LocationService.requestLocation(
        (latitude, longitude) => {
            console.log(`(HOOK LOKASI) Lokasi berhasil didapatkan: (${latitude}, ${longitude})`);
            onAllowCallback(latitude, longitude);
        },
        (error) => {
            console.error("(HOOK LOKASI) Gagal mendapatkan lokasi:", error);
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