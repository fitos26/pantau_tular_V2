import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { MapConfig, MapLocation, MapViewport } from "../../types";
import { useMapStore } from "../../store/store";
import { LayerManager } from "./LayerManager";
import { LegendBuilder } from "./LegendBuilder";
import { SeriesFactory } from "./SeriesFactory";

export class MapChartManager {
  private root: am5.Root | null = null;
  private chart: am5map.MapChart | null = null;
  private layerManager: LayerManager | null = null;
  private legendBuilder: LegendBuilder | null = null;
  private seriesFactory: SeriesFactory | null = null;
  private locations: MapLocation[] | null = null;
  private _countSelectedPoints = 0;
  private readonly onError: ((message: string) => void) | null = null;
  private readonly syncStore: boolean;
  private readonly onViewportChange: ((viewport: MapViewport) => void) | null = null;
  private viewportChangeTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    onError?: (message: string) => void,
    options?: {
      syncStore?: boolean;
      onViewportChange?: (viewport: MapViewport) => void;
    }
  ) {
    this.onError = onError || null;
    this.syncStore = options?.syncStore ?? true;
    this.onViewportChange = options?.onViewportChange ?? null;
  }

  initialize(containerId: string, config: MapConfig): void {
    try {
      const container = document.getElementById(containerId);
      if (!container) throw new Error(`Container with ID "${containerId}" not found.`);

      this.root = am5.Root.new(containerId);
      this.root.setThemes([am5themes_Animated.new(this.root)]);

      this.chart = this.root.container.children.push(
        am5map.MapChart.new(this.root, {
          panX: "rotateX",
          panY: "translateY",
          homeZoomLevel: config.zoomLevel,
          projection: am5map.geoMercator(),
          homeGeoPoint: config.centerPoint,
          minZoomLevel: 1,
          maxZoomLevel: 100,
        })
      );

      this.chart.set(
        "background",
        am5.Rectangle.new(this.root, {
          fill: am5.color("#E0E0E0"),
          fillOpacity: 1,
        })
      );

      this.initializeManagers();
      this.setupZoomControl();
      this.setupLayers();
      this.handleViewportUpdate();
      this.chart.appear(1000, 100);
    } catch (error) {
      console.error("Error initializing map:", error);
      if (this.onError) {
        this.onError("Failed to load the map. Please try again.");
      }
    }
  }

  private initializeManagers(): void {
    if (!this.chart || !this.root) return;

    this.layerManager = new LayerManager(this.root, this.chart);
    this.legendBuilder = new LegendBuilder(this.root, this.chart);
    this.seriesFactory = new SeriesFactory(this.root, this.chart);
  }

  private setupZoomControl(): void {
    if (!this.chart || !this.root) return;

    const zoomControl = this.chart.set("zoomControl", am5map.ZoomControl.new(this.root, {}));
    zoomControl.homeButton.set("visible", true);

    this.chart.on("zoomLevel", this.handleViewportUpdate.bind(this));
    this.chart.on("translateX", this.handleViewportUpdate.bind(this));
    this.chart.on("translateY", this.handleViewportUpdate.bind(this));
  }

  private setupLayers(): void {
    if (!this.seriesFactory || !this.legendBuilder || !this.layerManager || !this.chart) return;

    try {
      const basePolygonSeries = this.seriesFactory.createBasePolygonSeries();
      const highlightSeries = this.seriesFactory.createHighlightSeries();

      basePolygonSeries.events.on("datavalidated", () => {
        this.chart?.goHome();
      });

      const humiditySeries = this.seriesFactory.createHumiditySeries();
      const humidityLegend = this.legendBuilder.createHumidityLegend();

      const precipitationSeries = this.seriesFactory.createPrecipitationSeries();
      const precipitationLegend = this.legendBuilder.createPrecipitationLegend();

      const temperatureSeries = this.seriesFactory.createTemperatureSeries();
      const temperatureLegend = this.legendBuilder.createTemperatureLegend();

      const severitySeries = this.seriesFactory.createSeveritySeries();
      const severityLegend = this.legendBuilder.createSeverityLegend();

      const caseHeatmapSeries = this.seriesFactory.createCaseHeatmapSeries();
      const caseHeatmapLegend = this.legendBuilder.createCaseHeatmapLegend();

      const pointSeries = this.seriesFactory.createPointSeries();

      this.layerManager.setBasePolygonSeries(basePolygonSeries);
      this.layerManager.setHighlightSeries(highlightSeries);
      this.layerManager.setPointSeries(pointSeries);
      this.layerManager.setHumiditySeries(humiditySeries, humidityLegend);
      this.layerManager.setPrecipitationSeries(precipitationSeries, precipitationLegend);
      this.layerManager.setTemperatureSeries(temperatureSeries, temperatureLegend);
      this.layerManager.setSeveritySeries(severitySeries, severityLegend);
      this.layerManager.setCaseHeatmapSeries(caseHeatmapSeries, caseHeatmapLegend);
    } catch (error) {
      console.error("Error setting up layers:", error);
      if (this.onError) {
        this.onError("Error setting up map layers.");
      }
    }
  }

  private getPointsInSelection(): void {
    const viewport = this.getViewport();
    if (!viewport) return;

    let selectedPoints = 0;

    this.locations?.forEach((dataItem) => {
      const longitude = this.getLocationLongitude(dataItem);
      const latitude = this.getLocationLatitude(dataItem);

      if (longitude === null || latitude === null) {
        return;
      }

      if (
        longitude >= viewport.minLng &&
        longitude <= viewport.maxLng &&
        latitude >= viewport.minLat &&
        latitude <= viewport.maxLat
      ) {
        selectedPoints += dataItem.item_type === "cluster"
          ? Number(dataItem.cluster_count || 0)
          : 1;
      }
    });

    this.countSelectedPoints = selectedPoints;
  }

  get countSelectedPoints(): number {
    return this._countSelectedPoints;
  }

  private set countSelectedPoints(value: number) {
    this._countSelectedPoints = value;
    if (this.syncStore) {
      useMapStore.getState().setCountSelectedPoints(value);
    }
  }

  populateLocations(locations: MapLocation[]): void {
    if (!this.layerManager) return;

    const pointSeries = this.layerManager.getPointSeries();
    if (!pointSeries) return;

    this.locations = locations;
    pointSeries.data.clear();

    locations.forEach((location) => {
      const longitude = this.getLocationLongitude(location);
      const latitude = this.getLocationLatitude(location);

      if (longitude === null || latitude === null) {
        return;
      }

      pointSeries.data.push({
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        city: location.city,
        id: location.id,
        case_id: location.case_id ?? location.id,
        province: this.getLocationProvince(location),
        item_type: location.item_type ?? "marker",
        cluster_count: location.cluster_count ?? 1,
        total_news: location.total_news ?? 0,
        severity: location.severity ?? null,
        latitude,
        longitude,
      });
    });

    this.handleViewportUpdate();
  }

  zoomToLocation(latitude: number, longitude: number): void {
    if (!this.chart || !this.root || !this.seriesFactory || !this.layerManager) return;

    if (!this.layerManager.getLocationSeries()) {
      const locationSeries = this.seriesFactory.createLocationSeries();
      this.layerManager.setLocationSeries(locationSeries);
    }

    const locationSeries = this.layerManager.getLocationSeries();
    if (!locationSeries) return;

    try {
      locationSeries.data.clear();
      locationSeries.data.push({
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        title: "Your Location",
      });

      this.chart.zoomToGeoPoint({ longitude, latitude }, 32, true);
    } catch (error) {
      console.error("Failed to zoom to location: ", error);
      throw error;
    }
  }

  dispose(): void {
    if (this.viewportChangeTimeout) {
      clearTimeout(this.viewportChangeTimeout);
      this.viewportChangeTimeout = null;
    }

    if (this.root) {
      this.root.dispose();
      this.root = null;
      this.chart = null;
      this.layerManager = null;
      this.legendBuilder = null;
      this.seriesFactory = null;
    }
  }

  populateProvinceHumidityData(data: any[]): void {
    this.layerManager?.populateProvinceHumidityData(data);
  }

  populateProvinceTemperatureData(data: any[]): void {
    this.layerManager?.populateProvinceTemperatureData(data);
  }

  populateProvincePrecipitationData(data: any[]): void {
    this.layerManager?.populateProvincePrecipitationData(data);
  }

  populateProvinceSeverityData(data: any[]): void {
    this.layerManager?.populateProvinceSeverityData(data);
  }

  populateProvinceCaseHeatmapData(data: any[]): void {
    this.layerManager?.populateProvinceCaseHeatmapData(data);
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
    this.layerManager?.toggleLayers(
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

  private getLocationLongitude(location: MapLocation): number | null {
    const value = location.longitude ?? location.location__longitude ?? null;
    if (value === null || value === undefined) {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private getLocationLatitude(location: MapLocation): number | null {
    const value = location.latitude ?? location.location__latitude ?? null;
    if (value === null || value === undefined) {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private getLocationProvince(location: MapLocation): string {
    return (location.province ?? location.location__province ?? "").toString();
  }

  private getViewport(): MapViewport | null {
    if (!this.chart) {
      return null;
    }

    const topLeft = this.chart.invert({ x: 0, y: 0 });
    const bottomRight = this.chart.invert({
      x: this.chart.innerWidth(),
      y: this.chart.innerHeight(),
    });

    if (!topLeft || !bottomRight) {
      return null;
    }

    let minLng = Math.min(topLeft.longitude, bottomRight.longitude);
    let maxLng = Math.max(topLeft.longitude, bottomRight.longitude);

    if (topLeft.longitude > bottomRight.longitude) {
      minLng = -180;
      maxLng = 180;
    }

    return {
      minLat: Math.min(topLeft.latitude, bottomRight.latitude),
      maxLat: Math.max(topLeft.latitude, bottomRight.latitude),
      minLng,
      maxLng,
      zoom: Math.max(1, Math.round(Number(this.chart.get("zoomLevel") || 1))),
    };
  }

  private handleViewportUpdate(): void {
    this.getPointsInSelection();

    if (!this.onViewportChange) {
      return;
    }

    if (this.viewportChangeTimeout) {
      clearTimeout(this.viewportChangeTimeout);
    }

    this.viewportChangeTimeout = setTimeout(() => {
      const viewport = this.getViewport();
      if (viewport) {
        this.onViewportChange?.(viewport);
      }
    }, 150);
  }
}
