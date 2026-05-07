import { MapLocation, MapConfig, MapViewport, ProvinceData } from "../types";
import { MapChartManager } from "./map";

export class MapChartService {
  private readonly mapManager: MapChartManager;

  constructor(
    onError?: (message: string) => void,
    options?: {
      syncStore?: boolean;
      onViewportChange?: (viewport: MapViewport) => void;
    }
  ) {
    this.mapManager = new MapChartManager(onError, {
      syncStore: options?.syncStore ?? true,
      onViewportChange: options?.onViewportChange,
    });
  }

  initialize(containerId: string, config: MapConfig): void {
    this.mapManager.initialize(containerId, config);
  }

  dispose(): void {
    this.mapManager.dispose();
  }

  populateLocations(locations: MapLocation[]): void {
    this.mapManager.populateLocations(locations);
  }

  get countSelectedPoints(): number {
    return this.mapManager.countSelectedPoints;
  }

  zoomToLocation(latitude: number, longitude: number): void {
    this.mapManager.zoomToLocation(latitude, longitude);
  }

  populateProvinceHumidityData(provinceHumidityData: ProvinceData[]): void {
    this.mapManager.populateProvinceHumidityData(provinceHumidityData);
  }

  populateProvincePrecipitationData(provincePrecipitationData: ProvinceData[]): void {
    this.mapManager.populateProvincePrecipitationData(provincePrecipitationData);
  }

  populateProvinceTemperatureData(provinceTemperatureData: ProvinceData[]): void {
    this.mapManager.populateProvinceTemperatureData(provinceTemperatureData);
  }

  populateProvinceSeverityData(provinceSeverityData: ProvinceData[]): void {
    this.mapManager.populateProvinceSeverityData(provinceSeverityData);
  }

  populateProvinceCaseHeatmapData(provinceCaseHeatmapData: ProvinceData[]): void {
    this.mapManager.populateProvinceCaseHeatmapData(provinceCaseHeatmapData);
  }

  showHumidityLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, true, false, false);
  }

  hideHumidityLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, false);
  }

  showPrecipitationLayer(): void {
    this.mapManager.toggleLayers(true, true, true, true, false, false, false);
  }

  hidePrecipitationLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, false);
  }

  showTemperatureLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, true, false);
  }

  hideTemperatureLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, false);
  }

  showSeverityLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, true);
  }

  hideSeverityLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, false);
  }

  hideAllLayers(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, false);
  }

  showCaseHeatmapLayer(): void {
    this.mapManager.toggleLayers(true, true, false, false, false, false, false, true);
  }

  hideCaseHeatmapLayer(): void {
    this.mapManager.toggleLayers(true, true, true, false, false, false, false, false);
  }

  toggleLayers(
    showBase: boolean,
    showHighlight: boolean,
    showPoints: boolean,
    showPrecipitation: boolean,
    showHumidity: boolean,
    showTemperature: boolean,
    showSeverity: boolean,
    showCaseHeatmap = false
  ): void {
    this.mapManager.toggleLayers(
      showBase,
      showHighlight,
      showPoints,
      showPrecipitation,
      showHumidity,
      showTemperature,
      showSeverity,
      showCaseHeatmap
    );
  }
}
