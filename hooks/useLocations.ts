import { useEffect, useRef, useState } from 'react';
import { ClimatePeriod, FilterState, MapLocation, MapViewport, ProvinceData } from '../types';
import { mapApi } from '../services/api';

const DEFAULT_VIEWPORT: MapViewport = {
  minLat: -11.5,
  maxLat: 6.5,
  minLng: 94,
  maxLng: 141.5,
  zoom: 3,
};

const serializeFilterState = (
  state: FilterState,
  refreshToken = 0,
  viewport?: MapViewport,
  climatePeriod?: ClimatePeriod | null
): string => {
  const normalizeDate = (value: FilterState["start_date"]) => {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  };

  return JSON.stringify({
    ...state,
    start_date: normalizeDate(state.start_date),
    end_date: normalizeDate(state.end_date),
    viewport: viewport ?? DEFAULT_VIEWPORT,
    climatePeriod: climatePeriod ?? null,
    __refreshToken: refreshToken,
  });
};

export const useLocations = (
  filterState: FilterState,
  refreshToken = 0,
  viewport: MapViewport | null | undefined = undefined,
  climatePeriod: ClimatePeriod | null = null
) => {
  const [data, setData] = useState<MapLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [provinceHumidityData, setProvinceHumidityData] = useState<ProvinceData[]>([]);
  const [provinceTemperatureData, setProvinceTemperatureData] = useState<ProvinceData[]>([]);
  const [provincePrecipitationData, setProvincePrecipitationData] = useState<ProvinceData[]>([]);
  const [provinceSeverityData, setProvinceSeverityData] = useState<ProvinceData[]>([]);
  const [provinceCaseHeatmapData, setProvinceCaseHeatmapData] = useState<ProvinceData[]>([]);
  const lastSerializedFilterRef = useRef<string | null>(null);

  useEffect(() => {
    if (viewport === null) {
      lastSerializedFilterRef.current = null;
      setIsLoading(false);
      setError(null);
      setData([]);
      setProvinceHumidityData([]);
      setProvinceTemperatureData([]);
      setProvincePrecipitationData([]);
      setProvinceSeverityData([]);
      setProvinceCaseHeatmapData([]);
      return;
    }

    const activeViewport = viewport ?? DEFAULT_VIEWPORT;
    const serializedFilter = serializeFilterState(filterState, refreshToken, activeViewport, climatePeriod);

    // Skip re-fetching when filters are effectively unchanged
    if (lastSerializedFilterRef.current === serializedFilter) {
      return;
    }

    lastSerializedFilterRef.current = serializedFilter;
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const locationsPromise = mapApi.getMapData(filterState, activeViewport);
        const provinceDataPromise = Promise.all([
          mapApi.getProvinceData('humidity', climatePeriod),
          mapApi.getProvinceData('temperature', climatePeriod),
          mapApi.getProvinceData('precipitation', climatePeriod),
          mapApi.getProvinceData('weighted-severity'),
          mapApi.getProvinceCaseHeatmapData(filterState),
        ]);

        const locations = await locationsPromise;
        if (isCancelled || lastSerializedFilterRef.current !== serializedFilter) {
          return;
        }

        setData(locations || []);

        try {
          const [humidityData, temperatureData, precipitationData, severityData, caseHeatmapData] = await provinceDataPromise;

          if (isCancelled || lastSerializedFilterRef.current !== serializedFilter) {
            return;
          }

          setProvinceHumidityData(humidityData || []);
          setProvinceTemperatureData(temperatureData || []);
          setProvincePrecipitationData(precipitationData || []);
          setProvinceSeverityData(severityData || []);
          setProvinceCaseHeatmapData(caseHeatmapData || []);
        } catch (err) {
          if (isCancelled || lastSerializedFilterRef.current !== serializedFilter) {
            return;
          }

          console.error('Error fetching province data:', err);
          setProvinceHumidityData([]);
          setProvinceTemperatureData([]);
          setProvincePrecipitationData([]);
          setProvinceSeverityData([]);
          setProvinceCaseHeatmapData([]);
        }
      } catch (err) {
        if (isCancelled || lastSerializedFilterRef.current !== serializedFilter) {
          return;
        }

        console.error('Error in useLocations:', err);

        setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
        setData([]);
      } finally {
        if (!isCancelled && lastSerializedFilterRef.current === serializedFilter) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [filterState, refreshToken, viewport, climatePeriod]);

  return { data, isLoading, error, provinceHumidityData, provinceTemperatureData, provincePrecipitationData, provinceSeverityData, provinceCaseHeatmapData };
};
