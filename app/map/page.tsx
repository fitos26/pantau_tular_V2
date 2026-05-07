"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IndonesiaMap } from "../components/IndonesiaMap";
import { useLocations } from "../../hooks/useLocations";
import { useMapError } from "../../hooks/useMapError";
import { defaultMapConfig } from "../../data/indonesiaLocations";
import Navbar from "../components/Navbar";
import MapLoadErrorPopup from "../components/MapLoadErrorPopup";
import NoDataPopup from "../components/NoDataPopup";
import MultiSelectForm from "../components/filter/MultiSelectForm";
import FilterButton from "../components/floating_buttons/FilterButton";
import TimeRangeFilter from "../components/filter/TimeRangeFilter";
import ClimatePeriodControl from "../components/filter/ClimatePeriodControl";
import { ClimatePeriod, FilterState, MapViewport } from "../../types";
import SpatialComparisonPanel from "../components/spatial/SpatialComparisonPanel";

const DEFAULT_FILTER_STATE: FilterState = {
  diseases: [],
  locations: [],
  level_of_alertness: 0,
  portals: [],
  start_date: null,
  end_date: null,
  batch: null,
};

export default function MapPage() {
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [refreshToken, setRefreshToken] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30000);
  const [showAutoRefreshPanel, setShowAutoRefreshPanel] = useState(false);
  const [showSpatialComparison, setShowSpatialComparison] = useState(false);
  const [viewport, setViewport] = useState<MapViewport | null>(null);
  const [climatePeriod, setClimatePeriod] = useState<ClimatePeriod | null>(null);
  const {
    data: locations,
    isLoading,
    error,
    provinceHumidityData,
    provinceTemperatureData,
    provincePrecipitationData,
    provinceSeverityData,
    provinceCaseHeatmapData,
  } = useLocations(filterState, refreshToken, viewport, climatePeriod);
  const { error: mapError, setError: setMapError, clearError } = useMapError();
  const [isEmptyData, setIsEmptyData] = useState(false);
  const [emptyDataDismissed, setEmptyDataDismissed] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const timeRange = useMemo(
    () => ({
      start: filterState.start_date ?? null,
      end: filterState.end_date ?? null,
    }),
    [filterState.start_date, filterState.end_date]
  );
  const emptyDataKey = useMemo(
    () =>
      JSON.stringify({
        diseases: filterState.diseases,
        locations: filterState.locations,
        level_of_alertness: filterState.level_of_alertness,
        portals: filterState.portals,
        start_date: filterState.start_date?.toISOString() ?? null,
        end_date: filterState.end_date?.toISOString() ?? null,
        batch: filterState.batch,
        refreshToken,
        viewport,
      }),
    [filterState, refreshToken, viewport]
  );

  useEffect(() => {
    if (error) {
      if (
        error.message.includes("No case locations found") ||
        error.message.includes("HTTP error! status: 404")
      ) {
        if (!emptyDataDismissed) {
          setIsEmptyData(true);
        }
      } else {
        setMapError(error.message);
      }
    }
  }, [emptyDataDismissed, error, setMapError]);

  useEffect(() => {
    if (
      !emptyDataDismissed &&
      !mapError &&
      !error &&
      viewport !== null &&
      locations.length === 0 &&
      !isLoading
    ) {
      setIsEmptyData(true);
    }
  }, [emptyDataDismissed, locations, isLoading, mapError, error, viewport]);

  useEffect(() => {
    if (isLoading || viewport === null) {
      setIsEmptyData(false);
    }
  }, [isLoading, viewport]);

  useEffect(() => {
    setEmptyDataDismissed(false);
  }, [emptyDataKey]);

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return;
    }
    const timer = setInterval(() => {
      setRefreshToken((prev) => prev + 1);
    }, autoRefreshInterval);
    return () => clearInterval(timer);
  }, [autoRefreshEnabled, autoRefreshInterval]);

  const toggleFilterVisibility = () => {
    /* istanbul ignore next */
    setIsFilterVisible((prev) => !prev);
  };

  const handleMapError = useCallback(
    (message: string) => {
      setMapError(message);
    },
    [setMapError]
  );

  const handleFilterSubmit = useCallback((state: FilterState) => {
    setFilterState((prev) => ({
      ...prev,
      ...state,
    }));
  }, []);

  const handleViewportChange = useCallback((nextViewport: MapViewport) => {
    setViewport((prev) => {
      if (
        prev &&
        prev.minLat === nextViewport.minLat &&
        prev.maxLat === nextViewport.maxLat &&
        prev.minLng === nextViewport.minLng &&
        prev.maxLng === nextViewport.maxLng &&
        prev.zoom === nextViewport.zoom
      ) {
        return prev;
      }

      return nextViewport;
    });
  }, []);

  const triggerManualRefresh = () => {
    setRefreshToken((prev) => prev + 1);
  };

  let popup = null;
  if (mapError) {
    popup = <MapLoadErrorPopup message={mapError} onClose={clearError} />;
  } else if (isEmptyData) {
    popup = (
      <NoDataPopup
        onClose={() => {
          setIsEmptyData(false);
          setEmptyDataDismissed(true);
        }}
      />
    );
  }

  return (
    <>
      <Navbar />
      <div className="w-full min-h-[calc(100vh-5rem)] relative">
        <div className="fixed top-[calc(5rem+1rem)] left-4 z-30">
          <FilterButton onClick={toggleFilterVisibility} isActive={isFilterVisible} />
        </div>

        {isFilterVisible && (
          <div
            className="fixed top-[calc(5rem+5rem)] left-4 right-4 sm:left-4 sm:right-auto bg-white/95 shadow-xl rounded-lg p-4 z-20 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[520px] lg:w-[600px] max-w-[90vw] max-h-[80vh] overflow-y-auto backdrop-blur-sm"
            data-testid="filter-form"
          >
            <MultiSelectForm
              onSubmitFilterState={handleFilterSubmit}
              initialFilterState={filterState}
              onError={handleMapError}
            />
          </div>
        )}

        <div className="relative w-full h-[calc(100vh-6rem)]">
          {(viewport === null || isLoading) && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-lg font-medium">Loading map data...</p>
              </div>
            </div>
          )}

          {popup}
          <IndonesiaMap
            locations={locations || []}
            config={defaultMapConfig}
            width="100%"
            height="100%"
            onError={handleMapError}
            isFilterVisible={isFilterVisible}
            onFilterToggle={toggleFilterVisibility}
            provinceHumidityData={provinceHumidityData}
            provinceTemperatureData={provinceTemperatureData}
            provincePrecipitationData={provincePrecipitationData}
            provinceSeverityData={provinceSeverityData}
            provinceCaseHeatmapData={provinceCaseHeatmapData}
            onViewportChange={handleViewportChange}
            timeFilter={
              <div className="flex flex-col gap-2 md:flex-row md:items-end">
                <TimeRangeFilter
                  value={timeRange}
                  onApply={(range) => {
                    setFilterState((prev) => ({
                      ...prev,
                      start_date: range.start,
                      end_date: range.end,
                    }));
                  }}
                  onReset={() => {
                    setFilterState((prev) => ({
                      ...prev,
                      start_date: null,
                      end_date: null,
                    }));
                  }}
                />
                <ClimatePeriodControl value={climatePeriod} onApply={setClimatePeriod} />
              </div>
            }
          />

          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <button
              type="button"
              className="bg-white/90 shadow rounded-full px-4 py-2 text-sm font-semibold border"
              onClick={() => setShowSpatialComparison((prev) => !prev)}
              data-testid="spatial-toggle"
            >
              {showSpatialComparison ? "Tutup Peta Berdampingan" : "Perbandingan Spasial"}
            </button>
          </div>

          {showSpatialComparison ? (
            <div className="absolute inset-x-4 top-16 z-30 pointer-events-auto">
              <div className="bg-white shadow-2xl rounded-xl p-4 max-h-[70vh] overflow-y-auto border border-gray-200">
                <SpatialComparisonPanel
                  baseFilters={filterState}
                  refreshToken={refreshToken}
                  onError={handleMapError}
                  provinceHumidityData={provinceHumidityData}
                  provincePrecipitationData={provincePrecipitationData}
                  provinceSeverityData={provinceSeverityData}
                  provinceTemperatureData={provinceTemperatureData}
                  maxRegions={2}
                  overlayMode
                  onClose={() => setShowSpatialComparison(false)}
                />
              </div>
            </div>
          ) : null}

          <div className="absolute bottom-16 left-4 z-30 pointer-events-auto">
            <button
              type="button"
              className="bg-white/90 shadow rounded-md px-3 py-2 text-sm font-semibold border"
              onClick={() => setShowAutoRefreshPanel((prev) => !prev)}
              data-testid="auto-refresh-toggle-button"
            >
              {showAutoRefreshPanel ? "Tutup Auto Refresh" : "Auto Refresh"}
            </button>
            {showAutoRefreshPanel ? (
              <div className="mt-2 bg-white/95 shadow-lg rounded-lg p-3 w-64 text-sm space-y-2 border border-gray-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">Auto-refresh</span>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={autoRefreshEnabled}
                      onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                      data-testid="auto-refresh-toggle"
                    />
                    Aktif
                  </label>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <span>Interval</span>
                  <select
                    className="border rounded p-1 flex-1"
                    value={autoRefreshInterval}
                    onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                    data-testid="auto-refresh-interval"
                  >
                    <option value={15000}>15 detik</option>
                    <option value={30000}>30 detik</option>
                    <option value={60000}>60 detik</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={triggerManualRefresh}
                  className="w-full bg-blue-500 text-white py-1 rounded-md"
                  data-testid="manual-refresh"
                >
                  Muat ulang peta
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
