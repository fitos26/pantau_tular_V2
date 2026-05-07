import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import MapPage from "../../app/map/page";
import { useLocations } from "../../hooks/useLocations";
import { useMapError } from "../../hooks/useMapError";

let lastSpatialOnClose: (() => void) | null = null;

jest.mock("../../hooks/useLocations");
jest.mock("../../hooks/useMapError");

jest.mock("../../app/components/IndonesiaMap", () => ({
  IndonesiaMap: ({
    onError,
    onViewportChange,
    timeFilter,
  }: {
    onError: (message: string) => void;
    onViewportChange?: (viewport: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
      zoom: number;
    }) => void;
    timeFilter?: React.ReactNode;
  }) => {
    const React = require("react");

    React.useEffect(() => {
      onViewportChange?.({
        minLat: -10,
        maxLat: 5,
        minLng: 95,
        maxLng: 140,
        zoom: 6,
      });
    }, [onViewportChange]);

    return (
      <div>
        <button
          type="button"
          onClick={() => onError("Map error")}
          className="w-full h-full"
          data-testid="map-container"
        >
          Mock Indonesia Map
        </button>
        {timeFilter}
      </div>
    );
  },
}));

jest.mock("../../app/components/Navbar", () => () => <div>Navbar</div>);
jest.mock("../../app/components/MapLoadErrorPopup", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="error-popup">
      <button type="button" onClick={onClose} aria-label="Close error message">
        Close
      </button>
    </div>
  ),
}));

jest.mock("../../app/components/spatial/SpatialComparisonPanel", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose?: () => void }) => {
    lastSpatialOnClose = onClose || null;
    return <div data-testid="spatial-comparison-panel">Spatial comparison mock</div>;
  },
}));

jest.mock("../../app/components/floating_buttons/FilterButton", () => ({
  __esModule: true,
  default: ({ onClick, isActive }: { onClick: () => void; isActive: boolean }) => (
    <button type="button" data-testid="filter-toggle" data-active={isActive} onClick={onClick}>
      Filter {isActive ? "On" : "Off"}
    </button>
  ),
}));

jest.mock("../../app/components/filter/MultiSelectForm", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-multiselect-form">Filters</div>,
}));

jest.mock("../../app/components/filter/TimeRangeFilter", () => ({
  __esModule: true,
  default: ({
    onApply,
    onReset,
  }: {
    onApply: (value: { start: Date | null; end: Date | null }) => void;
    onReset: () => void;
  }) => (
    <div data-testid="time-range-filter">
      <button type="button" onClick={() => onApply({ start: null, end: null })}>
        Terapkan Rentang
      </button>
      <button type="button" onClick={onReset}>
        Atur Ulang Rentang
      </button>
    </div>
  ),
}));

describe("MapPage Component", () => {
  let mockSetError: jest.Mock;
  let mockClearError: jest.Mock;

  beforeEach(() => {
    mockSetError = jest.fn();
    mockClearError = jest.fn();
    lastSpatialOnClose = null;

    (useMapError as jest.Mock).mockImplementation(() => ({
      error: null,
      setError: mockSetError,
      clearError: mockClearError,
    }));

    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: true,
      error: null,
      provinceHumidityData: [],
      provinceTemperatureData: [],
      provincePrecipitationData: [],
      provinceSeverityData: [],
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the map shell and loading overlay", async () => {
    const { rerender } = render(<MapPage />);

    expect(screen.getByText(/loading map data/i)).toBeInTheDocument();
    expect(screen.getByTestId("map-container")).toBeInTheDocument();

    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [{ id: "1", city: "Jakarta", latitude: -6.2, longitude: 106.8 }],
      isLoading: false,
      error: null,
      provinceHumidityData: [],
      provinceTemperatureData: [],
      provincePrecipitationData: [],
      provinceSeverityData: [],
    }));

    rerender(<MapPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading map data/i)).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("time-range-filter")).toBeInTheDocument();
  });

  it("handles map errors correctly", async () => {
    let mockError: string | null = null;

    (useMapError as jest.Mock).mockImplementation(() => ({
      error: mockError,
      setError: (error: string) => {
        mockError = error;
        mockSetError(error);
      },
      clearError: () => {
        mockError = null;
        mockClearError();
      },
    }));

    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: null,
      provinceHumidityData: [],
      provinceTemperatureData: [],
      provincePrecipitationData: [],
      provinceSeverityData: [],
    }));

    const { rerender } = render(<MapPage />);

    fireEvent.click(screen.getByTestId("map-container"));
    rerender(<MapPage />);

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith("Map error");
    });

    fireEvent.click(screen.getByText("Close"));
    rerender(<MapPage />);

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  it("shows no data popup once viewport is ready and results are empty", async () => {
    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: null,
      provinceHumidityData: [],
      provinceTemperatureData: [],
      provincePrecipitationData: [],
      provinceSeverityData: [],
    }));

    render(<MapPage />);

    expect(await screen.findByText(/data tidak ditemukan/i)).toBeInTheDocument();
  });

  it("allows closing the no data popup", async () => {
    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: null,
      provinceHumidityData: [],
      provinceTemperatureData: [],
      provincePrecipitationData: [],
      provinceSeverityData: [],
    }));

    render(<MapPage />);

    const closeNoData = await screen.findByText(/tutup/i);
    fireEvent.click(closeNoData);

    await waitFor(() =>
      expect(screen.queryByText(/data tidak ditemukan/i)).not.toBeInTheDocument()
    );
  });

  it("toggles the filter form visibility", () => {
    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: null,
      provinceHumidityData: [],
      provinceTemperatureData: [],
      provincePrecipitationData: [],
      provinceSeverityData: [],
    }));

    render(<MapPage />);

    expect(screen.queryByTestId("filter-form")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("filter-toggle"));
    expect(screen.getByTestId("filter-form")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("filter-toggle"));
    expect(screen.queryByTestId("filter-form")).not.toBeInTheDocument();
  });

  it("toggles the spatial comparison overlay and closes it via child callback", async () => {
    (useLocations as jest.Mock).mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: null,
      provinceHumidityData: [],
      provinceTemperatureData: [],
      provincePrecipitationData: [],
      provinceSeverityData: [],
    }));

    render(<MapPage />);

    expect(screen.queryByTestId("spatial-comparison-panel")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("spatial-toggle"));
    expect(screen.getByTestId("spatial-comparison-panel")).toBeInTheDocument();

    await act(async () => {
      lastSpatialOnClose?.();
    });

    expect(screen.queryByTestId("spatial-comparison-panel")).not.toBeInTheDocument();
  });

  it("triggers manual refresh and passes incremented refreshToken to useLocations", () => {
    let lastRefresh = -1;
    (useLocations as jest.Mock).mockImplementation((_filters, refreshToken) => {
      lastRefresh = refreshToken;
      return {
        data: [],
        isLoading: false,
        error: null,
        provinceHumidityData: [],
        provinceTemperatureData: [],
        provincePrecipitationData: [],
        provinceSeverityData: [],
      };
    });

    render(<MapPage />);

    expect(lastRefresh).toBe(0);
    fireEvent.click(screen.getByTestId("auto-refresh-toggle-button"));
    fireEvent.click(screen.getByTestId("manual-refresh"));
    expect(lastRefresh).toBe(1);
  });
});
