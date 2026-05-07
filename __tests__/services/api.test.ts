import { mapApi, resetPasswordApi } from "../../services/api";
import { API_BASE } from "../../config";

global.fetch = jest.fn();

const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

const createJsonResponse = (payload: unknown, overrides: Record<string, unknown> = {}) => ({
  ok: true,
  status: 200,
  headers: {
    get: (name: string) =>
      name.toLowerCase() === "content-type" ? "application/json" : null,
  },
  json: () => Promise.resolve(payload),
  text: () => Promise.resolve(JSON.stringify(payload)),
  ...overrides,
});

const createValidToken = () =>
  `header.${btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })
  )}.sig`;

describe("mapApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key: string) =>
          key === "accessToken" ? createValidToken() : null
        ),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(),
      },
      writable: true,
    });
  });

  it("fetches locations from the legacy endpoint", async () => {
    const mockResponse = [{ id: "1", city: "Jakarta" }];
    (global.fetch as jest.Mock).mockResolvedValueOnce(createJsonResponse(mockResponse));

    const result = await mapApi.getLocations();

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE}/cases/locations/`,
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    );
  });

  it("fetches map data with viewport and filters via GET query params", async () => {
    const mockResponse = [{ id: "1", city: "Jakarta", item_type: "marker" }];
    (global.fetch as jest.Mock).mockResolvedValueOnce(createJsonResponse(mockResponse));

    const result = await mapApi.getMapData(
      {
        diseases: ["Dengue"],
        locations: ["Jakarta"],
        level_of_alertness: 2,
        portals: ["news-portal-1"],
        start_date: new Date("2023-01-01"),
        end_date: new Date("2023-12-31"),
        batch: null,
      },
      {
        minLat: -10,
        maxLat: 5,
        minLng: 95,
        maxLng: 140,
        zoom: 6,
      }
    );

    expect(result).toEqual(mockResponse);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      `${API_BASE}/api/map-data/`
    );
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("disease=Dengue");
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("zoom=6");
  });

  it("fetches dashboard data via GET query params", async () => {
    const mockResponse = { severity_statistics: { total_cases: 100 } };
    (global.fetch as jest.Mock).mockResolvedValueOnce(createJsonResponse(mockResponse));

    const result = await mapApi.getDashboardData({
      diseases: ["Dengue"],
      locations: ["Jakarta"],
      level_of_alertness: 2,
      portals: ["news-portal-1"],
      start_date: new Date("2023-01-01"),
      end_date: new Date("2023-12-31"),
      batch: null,
    });

    expect(result).toEqual(mockResponse);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      `${API_BASE}/api/statistics/`
    );
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("portal=news-portal-1");
  });

  it("fetches case detail from the new map-detail endpoint", async () => {
    const mockCaseDetail = { id: "123", location: "Jakarta" };
    (global.fetch as jest.Mock).mockResolvedValueOnce(createJsonResponse(mockCaseDetail));

    const result = await mapApi.getCaseDetail("123");

    expect(result).toEqual(mockCaseDetail);
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE}/api/map-detail/123/`,
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    );
  });

  it("returns an empty list for expert batches on 404 and dedupes concurrent calls", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createJsonResponse({}, { ok: false, status: 404 })
    );

    const [first, second] = await Promise.all([
      mapApi.getExpertBatches(),
      mapApi.getExpertBatches(),
    ]);

    expect(first).toEqual([]);
    expect(second).toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("fetches province data", async () => {
    const mockProvinceData = [{ id: "Jawa Barat", value: 120 }];
    (global.fetch as jest.Mock).mockResolvedValueOnce(createJsonResponse(mockProvinceData));

    const result = await mapApi.getProvinceData("cases");

    expect(result).toEqual(mockProvinceData);
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE}/api/province-cases/`,
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    );
  });
});

describe("resetPasswordApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resets password successfully", async () => {
    const successResponse = { detail: "Password berhasil diganti" };
    (global.fetch as jest.Mock).mockResolvedValueOnce(createJsonResponse(successResponse));

    const result = await resetPasswordApi.resetPassword(
      "user123",
      "validtoken456",
      "NewPassword123!",
      "NewPassword123!"
    );

    expect(result).toEqual(successResponse);
  });

  it("throws the endpoint-specific reset password error message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createJsonResponse({ detail: "Invalid link" }, { ok: false, status: 400 })
    );

    await expect(
      resetPasswordApi.resetPassword(
        "invaliduid",
        "validtoken456",
        "NewPassword123!",
        "NewPassword123!"
      )
    ).rejects.toThrow(
      `Gagal reset password ke ${API_BASE}/authentication/password-reset-confirm/invaliduid/validtoken456`
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
