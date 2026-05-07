import { renderHook, act } from '@testing-library/react';
import { useLocationHandlers } from '../../hooks/useLocationHandlers';
import { LocationService } from '../../services/LocationService';

// Mock the LocationService
jest.mock('../../services/LocationService', () => ({
  LocationService: {
    requestLocation: jest.fn()
  }
}));

// Mocked implementation of console methods
global.console = {
  ...global.console,
  log: jest.fn(),
  error: jest.fn()
};

describe('useLocationHandlers', () => {
  // Mock functions to pass to the hook
  const mockSetShowPopup = jest.fn();
  const mockSetLocationError = jest.fn();
  const mockOnAllowCallback = jest.fn();
  const mockOnDenyCallback = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('handleAllow should close popup and request location', () => {
    // Render the hook
    const { result } = renderHook(() => useLocationHandlers(
      mockSetShowPopup,
      mockSetLocationError,
      mockOnAllowCallback,
      mockOnDenyCallback
    ));
    
    // Mock successful location retrieval
    (LocationService.requestLocation as jest.Mock).mockImplementation((onSuccess, onError) => {
      onSuccess(-6.2, 106.8);
    });
    
    // Call handleAllow
    act(() => {
      result.current.handleAllow();
    });
    
    // Verify popup was closed
    expect(mockSetShowPopup).toHaveBeenCalledWith(false);
    
    // Verify LocationService was called
    expect(LocationService.requestLocation).toHaveBeenCalled();
    
    // Verify success callback was called with coordinates
    expect(mockOnAllowCallback).toHaveBeenCalledWith(-6.2, 106.8);
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalledWith('Izin lokasi diberikan.');
    expect(console.log).toHaveBeenCalledWith('Lokasi berhasil didapatkan: (-6.2, 106.8)');
  });
  
  test('handleAllow should handle location error', () => {
    // Render the hook
    const { result } = renderHook(() => useLocationHandlers(
      mockSetShowPopup,
      mockSetLocationError,
      mockOnAllowCallback,
      mockOnDenyCallback
    ));
    
    // Mock location error
    const mockError = {
      type: 'POSITION_UNAVAILABLE',
      message: 'Informasi lokasi tidak tersedia.'
    };
    
    (LocationService.requestLocation as jest.Mock).mockImplementation((onSuccess, onError) => {
      onError(mockError);
    });
    
    // Call handleAllow
    act(() => {
      result.current.handleAllow();
    });
    
    // Verify popup was closed
    expect(mockSetShowPopup).toHaveBeenCalledWith(false);
    
    // Verify LocationService was called
    expect(LocationService.requestLocation).toHaveBeenCalled();
    
    // Verify error was handled
    expect(mockSetLocationError).toHaveBeenCalledWith(mockError);
    expect(console.error).toHaveBeenCalledWith('Gagal mendapatkan lokasi:', mockError);
    
    // Verify success callback was not called
    expect(mockOnAllowCallback).not.toHaveBeenCalled();
  });
  
  test('handleDeny should close popup and call deny callback', () => {
    // Render the hook
    const { result } = renderHook(() => useLocationHandlers(
      mockSetShowPopup,
      mockSetLocationError,
      mockOnAllowCallback,
      mockOnDenyCallback
    ));
    
    // Call handleDeny
    act(() => {
      result.current.handleDeny();
    });
    
    // Verify popup was closed
    expect(mockSetShowPopup).toHaveBeenCalledWith(false);
    
    // Verify error was set
    expect(mockSetLocationError).toHaveBeenCalledWith({
      type: 'PERMISSION_DENIED',
      message: 'Izin akses lokasi ditolak. Izinkan akses lokasi di pengaturan browser Anda.'
    });
    
    // Verify deny callback was called
    expect(mockOnDenyCallback).toHaveBeenCalled();
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalledWith('Izin lokasi ditolak.');
  });
});