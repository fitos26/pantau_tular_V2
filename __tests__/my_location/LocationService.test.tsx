import { LocationService } from "../../services/LocationService";

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  permissions: {
    query: jest.fn()
  }
};

describe("LocationService", () => {
  let mockOnSuccess: jest.Mock;
  let mockOnError: jest.Mock;

  beforeEach(() => {
    // Setup mocks
    mockOnSuccess = jest.fn();
    mockOnError = jest.fn();
    jest.clearAllMocks();

    // Setup navigator mock
    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation.getCurrentPosition,
      configurable: true,
    });

    // Setup permissions mock
    Object.defineProperty(global.navigator, "permissions", {
      value: mockGeolocation.permissions,
      configurable: true,
    });
  });

  describe("checkPermission", () => {
    test("should query geolocation permission", async () => {
      const mockPermissionStatus = { state: "granted" };
      mockGeolocation.permissions.query.mockResolvedValue(mockPermissionStatus);

      const result = await LocationService.checkPermission();
      
      expect(navigator.permissions.query).toHaveBeenCalledWith({ name: "geolocation" });
      expect(result).toBe(mockPermissionStatus);
    });
  });

  describe("handleSuccess", () => {
    test("should extract coordinates and call onSuccess", () => {
      const position = Object.create({
        coords: Object.create({
          latitude: 10.123,
          longitude: 45.678,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}) // Tambahkan `toJSON()` agar sesuai dengan `GeolocationCoordinates`
        }),
        timestamp: Date.now(),
        toJSON: () => ({}) // Tambahkan `toJSON()` agar sesuai dengan `GeolocationPosition`
      });
  
      LocationService.handleSuccess(position, mockOnSuccess);
  
      expect(mockOnSuccess).toHaveBeenCalledWith(10.123, 45.678);
    });
  });

  describe("handleError", () => {
    test("should handle PERMISSION_DENIED error", () => {
      const error = Object.create({
        code: 1,
        message: "Permission denied"
      });

      LocationService.handleError(error, mockOnError);
      
      expect(mockOnError).toHaveBeenCalledWith({
        type: "PERMISSION_DENIED",
        message: "Izin akses lokasi ditolak. Izinkan akses lokasi di pengaturan browser Anda."
      });
    });

    test("should handle POSITION_UNAVAILABLE error", () => {
      const error = Object.create({
        code: 2,
        message: "Position unavailable"
      });

      LocationService.handleError(error, mockOnError);
      
      expect(mockOnError).toHaveBeenCalledWith({
        type: "POSITION_UNAVAILABLE",
        message: "Informasi lokasi tidak tersedia. Mungkin karena koneksi lemah atau masalah perangkat."
      });
    });

    test("should handle TIMEOUT error", () => {
      const error = Object.create({
        code: 3, 
        message: "Timeout"
      });

      LocationService.handleError(error, mockOnError);
      
      expect(mockOnError).toHaveBeenCalledWith({
        type: "TIMEOUT",
        message: "Permintaan lokasi habis waktu. Silakan coba lagi."
      });
    });

    test("should handle unknown error", () => {
      const error = Object.create({
        code: 999,
        message: "Unknown error"
      });

      LocationService.handleError(error, mockOnError);
      
      expect(mockOnError).toHaveBeenCalledWith({
        type: "UNKNOWN",
        message: "Gagal mendapatkan lokasi Anda."
      });
    });
  });

  describe("requestLocation", () => {
    test("should handle browser not supporting geolocation", () => {
      // Remove geolocation from navigator
      Object.defineProperty(global.navigator, "geolocation", {
        value: undefined,
        configurable: true,
      });

      LocationService.requestLocation(mockOnSuccess, mockOnError);
      
      expect(mockOnError).toHaveBeenCalledWith({
        type: "BROWSER_UNSUPPORTED",
        message: "Browser Anda tidak mendukung fitur geolokasi."
      });
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test("should request current position when browser supports geolocation", () => {
      // Mock geolocation API
      const getCurrentPositionMock = jest.fn();
      Object.defineProperty(global.navigator, "geolocation", {
        value: { getCurrentPosition: getCurrentPositionMock },
        configurable: true,
      });

      LocationService.requestLocation(mockOnSuccess, mockOnError);
      
      expect(getCurrentPositionMock).toHaveBeenCalled();
      // Verify options are passed correctly
      expect(getCurrentPositionMock.mock.calls[0][2]).toEqual({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });

    test("should call handleSuccess when position is available", () => {
      // Create a spy on the handleSuccess method
      const handleSuccessSpy = jest.spyOn(LocationService, "handleSuccess");
      
      // Mock geolocation API to immediately succeed
      const getCurrentPositionMock = jest.fn().mockImplementation((success) => {
        const position = {
          coords: {
            latitude: 10.123,
            longitude: 45.678,
            accuracy: 5,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        };
        success(position);
      });
      
      Object.defineProperty(global.navigator, "geolocation", {
        value: { getCurrentPosition: getCurrentPositionMock },
        configurable: true,
      });

      LocationService.requestLocation(mockOnSuccess, mockOnError);
      
      expect(handleSuccessSpy).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith(10.123, 45.678);
      
      handleSuccessSpy.mockRestore();
    });

    test("should call handleError when there's an error getting position", () => {
      // Create a spy on the handleError method
      const handleErrorSpy = jest.spyOn(LocationService, "handleError");
      
      // Mock geolocation API to immediately fail
      const getCurrentPositionMock = jest.fn().mockImplementation((success, error) => {
        const positionError = {
          code: 1,
          message: "Permission denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        };
        error(positionError);
      });
      
      Object.defineProperty(global.navigator, "geolocation", {
        value: { getCurrentPosition: getCurrentPositionMock },
        configurable: true,
      });

      LocationService.requestLocation(mockOnSuccess, mockOnError);
      
      expect(handleErrorSpy).toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalledWith({
        type: "PERMISSION_DENIED",
        message: "Izin akses lokasi ditolak. Izinkan akses lokasi di pengaturan browser Anda."
      });
      
      handleErrorSpy.mockRestore();
    });
  });
});