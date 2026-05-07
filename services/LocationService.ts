export type LocationErrorType = 
  | "BROWSER_UNSUPPORTED" 
  | "PERMISSION_DENIED" 
  | "POSITION_UNAVAILABLE" 
  | "TIMEOUT" 
  | "UNKNOWN";

export interface LocationError {
    type: LocationErrorType;
    message: string;
}

export const LocationService = {
    // Mengecek status izin lokasi pengguna
    checkPermission: async () => {
        return navigator.permissions.query({ name: "geolocation" });
    },

    // Fungsi untuk menangani lokasi yang berhasil diambil
    handleSuccess: (
        position: GeolocationPosition,
        onSuccess: (latitude: number, longitude: number) => void
    ) => {
        const { latitude, longitude } = position.coords;
        onSuccess(latitude, longitude);
    },

    // Fungsi untuk menangani error saat mengambil lokasi
    handleError: (
        error: GeolocationPositionError,
        onError: (error: LocationError) => void
    ) => {
        let locationError: LocationError = {
            type: "UNKNOWN",
            message: "Gagal mendapatkan lokasi Anda."
        };

        switch (error.code) {
            case 1:
                locationError = {
                    type: "PERMISSION_DENIED",
                    message: "Izin akses lokasi ditolak. Izinkan akses lokasi di pengaturan browser Anda."
                };
                break;
            case 2:
                locationError = {
                    type: "POSITION_UNAVAILABLE",
                    message: "Informasi lokasi tidak tersedia. Mungkin karena koneksi lemah atau masalah perangkat."
                };
                break;
            case 3:
                locationError = {
                    type: "TIMEOUT",
                    message: "Permintaan lokasi habis waktu. Silakan coba lagi."
                };
                break;
        }

        onError(locationError);
    },

    // Fungsi utama untuk meminta lokasi pengguna
    requestLocation: (
        onSuccess: (latitude: number, longitude: number) => void, 
        onError: (error: LocationError) => void
    ) => {
        if (!navigator.geolocation) {
            onError({
                type: "BROWSER_UNSUPPORTED",
                message: "Browser Anda tidak mendukung fitur geolokasi."
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => LocationService.handleSuccess(position, onSuccess),
            (error) => LocationService.handleError(error, onError),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }
};