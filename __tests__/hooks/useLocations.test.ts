import { renderHook, waitFor } from "@testing-library/react";
import { useLocations } from "../../hooks/useLocations";
import { mapApi } from "../../services/api";
import { FilterState, MapLocation, MapViewport } from "../../types";

jest.mock("../../services/api", () => ({
  mapApi: {
    getMapData: jest.fn(),
    getProvinceData: jest.fn().mockResolvedValue([]),
    getProvinceCaseHeatmapData: jest.fn().mockResolvedValue([]),
  },
}));

describe("useLocations", () => {
  const defaultFilterState: FilterState = {
    diseases: [],
    locations: [],
    level_of_alertness: 0,
    portals: [],
    start_date: null,
    end_date: null,
    batch: null,
  };

  const viewport: MapViewport = {
    minLat: -10,
    maxLat: 5,
    minLng: 95,
    maxLng: 140,
    zoom: 6,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches viewport-based map data successfully", async () => {
    const mockLocations: MapLocation[] = [
      {
        id: "1",
        city: "Jakarta",
        latitude: -6.2,
        longitude: 106.8,
        province: "DKI Jakarta",
        item_type: "marker",
      },
    ];

    (mapApi.getMapData as jest.Mock).mockResolvedValueOnce(mockLocations);

    const { result } = renderHook(() =>
      useLocations(defaultFilterState, 0, viewport)
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockLocations);
    expect(result.current.error).toBe(null);
    expect(mapApi.getMapData).toHaveBeenCalledWith(defaultFilterState, viewport);
  });

  it("handles API errors correctly", async () => {
    const error = new Error("API Error");
    (mapApi.getMapData as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() =>
      useLocations(defaultFilterState, 0, viewport)
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toEqual(error);
  });

  it("skips fetching until viewport is available", async () => {
    const { result } = renderHook(() =>
      useLocations(defaultFilterState, 0, null)
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);
    expect(mapApi.getMapData).not.toHaveBeenCalled();
  });

  it("refetches when refreshToken changes", async () => {
    const first: MapLocation[] = [
      { id: "1", city: "A", latitude: 1, longitude: 1, province: "P1" },
    ];
    const second: MapLocation[] = [
      { id: "2", city: "B", latitude: 2, longitude: 2, province: "P2" },
    ];

    (mapApi.getMapData as jest.Mock)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);

    const { result, rerender } = renderHook(
      ({ refresh }) => useLocations(defaultFilterState, refresh, viewport),
      { initialProps: { refresh: 0 } }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(first);

    rerender({ refresh: 1 });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(second);
    expect(mapApi.getMapData).toHaveBeenCalledTimes(2);
  });
});
