import { useEffect, useRef, useState } from "react";
import { MapChartService } from "../services/mapChartService";
import { MapLocation, MapConfig, MapViewport, ProvinceData } from "../types";
import { useMapStore } from "../store/store";

export function useIndonesiaMap(
  containerId: string,
  locations: MapLocation[],
  config: MapConfig,
  provinceHumidityData: ProvinceData[],
  provinceTemperatureData: ProvinceData[],
  provincePrecipitationData: ProvinceData[],
  provinceSeverityData: ProvinceData[],
  provinceCaseHeatmapData: ProvinceData[],
  onError: (message: string) => void,
  initialized = false,
  options?: {
    shareStore?: boolean;
    syncStore?: boolean;
    onViewportChange?: (viewport: MapViewport) => void;
  }
) {
  const mapServiceRef = useRef<MapChartService | null>(null);
  const [mapService, setMapService] = useState<MapChartService | null>(null);
  const locationsRef = useRef<MapLocation[]>(locations);
  const setMapServiceStore = useMapStore((state) => state.setMapService);
  const shareStore = options?.shareStore ?? true;
  const syncStore = options?.syncStore ?? true;

  useEffect(() => {
    /* istanbul ignore next */
    if (mapServiceRef.current) {
      return;
    }

    const service = new MapChartService(onError, {
      syncStore,
      onViewportChange: options?.onViewportChange,
    });

    try {
      service.initialize(containerId, config);
      service.populateLocations(locations);
      service.populateProvinceHumidityData(provinceHumidityData);
      service.populateProvincePrecipitationData(provincePrecipitationData);
      service.populateProvinceTemperatureData(provinceTemperatureData);
      service.populateProvinceSeverityData(provinceSeverityData);
      service.populateProvinceCaseHeatmapData(provinceCaseHeatmapData);
      mapServiceRef.current = service;
      setMapService(service);
      if (shareStore) {
        setMapServiceStore(service);
      }
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }

    return () => {
      /* istanbul ignore next */
      if (!initialized && mapServiceRef.current) {
        mapServiceRef.current.dispose();
        mapServiceRef.current = null;
        if (shareStore) {
          setMapServiceStore(null);
        }
      }
    };
  }, [containerId, onError, options?.onViewportChange, setMapServiceStore, shareStore, syncStore]);

  useEffect(() => {
    if (!mapServiceRef.current || locations === locationsRef.current) {
      return;
    }

    locationsRef.current = locations;

    try {
      mapServiceRef.current.populateLocations(locations);
    } catch (error) {
      /*istanbul ignore next*/
      console.error("Failed to update map locations:", error);
    }
  }, [locations]);

  useEffect(() => {
    if (!mapServiceRef.current) {
      return;
    }

    try {
      mapServiceRef.current.populateProvinceHumidityData(provinceHumidityData);
      mapServiceRef.current.populateProvincePrecipitationData(provincePrecipitationData);
      mapServiceRef.current.populateProvinceTemperatureData(provinceTemperatureData);
      mapServiceRef.current.populateProvinceSeverityData(provinceSeverityData);
      mapServiceRef.current.populateProvinceCaseHeatmapData(provinceCaseHeatmapData);
    } catch (error) {
      console.error("Failed to update map province layers:", error);
    }
  }, [
    provinceCaseHeatmapData,
    provinceHumidityData,
    provincePrecipitationData,
    provinceSeverityData,
    provinceTemperatureData,
  ]);

  return { mapService: mapServiceRef.current };
}
