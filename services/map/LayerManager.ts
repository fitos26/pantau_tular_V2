import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import { ProvinceData } from "../../types";

export class LayerManager {
  private readonly root: am5.Root;
  private readonly chart: am5map.MapChart;
  private basePolygonSeries: am5map.MapPolygonSeries | null = null;
  private highlightSeries: am5map.MapPolygonSeries | null = null;
  private pointSeries: am5map.MapPointSeries | null = null;
  private locationSeries: am5map.MapPointSeries | null = null;
  private precipitationSeries: am5map.MapPolygonSeries | null = null;
  private humiditySeries: am5map.MapPolygonSeries | null = null;
  private temperatureSeries: am5map.MapPolygonSeries | null = null;
  private severitySeries: am5map.MapPolygonSeries | null = null;
  private caseHeatmapSeries: am5map.MapPolygonSeries | null = null;
  private precipitationHeatLegend: am5.Container | null = null;
  private humidityHeatLegend: am5.Container | null = null;
  private temperatureHeatLegend: am5.Container | null = null;
  private severityHeatLegend: am5.Container | null = null;
  private caseHeatmapLegend: am5.Container | null = null;
  private provinceHumidityData: ProvinceData[] | null = null;
  private provinceTemperatureData: ProvinceData[] | null = null;
  private provincePrecipitationData: ProvinceData[] | null = null;
  private provinceSeverityData: ProvinceData[] | null = null;
  private provinceCaseHeatmapData: ProvinceData[] | null = null;

  constructor(root: am5.Root, chart: am5map.MapChart) {
    this.root = root;
    this.chart = chart;
  }

  getBasePolygonSeries(): am5map.MapPolygonSeries | null {
    return this.basePolygonSeries;
  }

  getHighlightSeries(): am5map.MapPolygonSeries | null {
    return this.highlightSeries;
  }

  getPointSeries(): am5map.MapPointSeries | null {
    return this.pointSeries;
  }

  getLocationSeries(): am5map.MapPointSeries | null {
    return this.locationSeries;
  }

  getPrecipitationSeries(): am5map.MapPolygonSeries | null {
    return this.precipitationSeries;
  }

  getHumiditySeries(): am5map.MapPolygonSeries | null {
    return this.humiditySeries;
  }

  getTemperatureSeries(): am5map.MapPolygonSeries | null {
    return this.temperatureSeries;
  }

  getSeveritySeries(): am5map.MapPolygonSeries | null {
    return this.severitySeries;
  }

  getCaseHeatmapSeries(): am5map.MapPolygonSeries | null {
    return this.caseHeatmapSeries;
  }

  setBasePolygonSeries(series: am5map.MapPolygonSeries): void {
    this.basePolygonSeries = series;
  }

  setHighlightSeries(series: am5map.MapPolygonSeries): void {
    this.highlightSeries = series;
  }

  setPointSeries(series: am5map.MapPointSeries): void {
    this.pointSeries = series;
  }

  setLocationSeries(series: am5map.MapPointSeries): void {
    this.locationSeries = series;
  }

  setPrecipitationSeries(series: am5map.MapPolygonSeries, legend: am5.Container): void {
    this.precipitationSeries = series;
    this.precipitationHeatLegend = legend;
  }

  setHumiditySeries(series: am5map.MapPolygonSeries, legend: am5.Container): void {
    this.humiditySeries = series;
    this.humidityHeatLegend = legend;
  }

  setTemperatureSeries(series: am5map.MapPolygonSeries, legend: am5.Container): void {
    this.temperatureSeries = series;
    this.temperatureHeatLegend = legend;
  }

  setSeveritySeries(series: am5map.MapPolygonSeries, legend: am5.Container): void {
    this.severitySeries = series;
    this.severityHeatLegend = legend;
  }

  setCaseHeatmapSeries(series: am5map.MapPolygonSeries, legend: am5.Container): void {
    this.caseHeatmapSeries = series;
    this.caseHeatmapLegend = legend;
  }

  showBaseLayer(): void {
    this.basePolygonSeries?.show();
  }

  hideBaseLayer(): void {
    this.basePolygonSeries?.hide();
  }

  showHighlightLayer(): void {
    this.highlightSeries?.show();
  }

  hideHighlightLayer(): void {
    this.highlightSeries?.hide();
  }

  showPointLayer(): void {
    this.pointSeries?.show();
  }

  hidePointLayer(): void {
    this.pointSeries?.hide();
  }

  showHumidityLayer(): void {
    if (this.humiditySeries && this.humidityHeatLegend) {
      this.humiditySeries.show();
      this.humidityHeatLegend.show();
      this.chart.markDirty();
      this.humidityHeatLegend.parent?.toFront();
    }
  }

  hideHumidityLayer(): void {
    if (this.humiditySeries && this.humidityHeatLegend) {
      this.humiditySeries.hide();
      this.humidityHeatLegend.hide();
      this.chart.markDirty();
    }
  }

  showPrecipitationLayer(): void {
    if (this.precipitationSeries && this.precipitationHeatLegend) {
      this.precipitationSeries.show();
      this.precipitationHeatLegend.show();
      this.chart.markDirty();
      this.precipitationHeatLegend.parent?.toFront();
    }
  }

  hidePrecipitationLayer(): void {
    if (this.precipitationSeries && this.precipitationHeatLegend) {
      this.precipitationSeries.hide();
      this.precipitationHeatLegend.hide();
      this.chart.markDirty();
    }
  }

  showTemperatureLayer(): void {
    if (this.temperatureSeries && this.temperatureHeatLegend) {
      this.temperatureSeries.show();
      this.temperatureHeatLegend.show();
      this.chart.markDirty();
      this.temperatureHeatLegend.parent?.toFront();
    }
  }

  hideTemperatureLayer(): void {
    if (this.temperatureSeries && this.temperatureHeatLegend) {
      this.temperatureSeries.hide();
      this.temperatureHeatLegend.hide();
      this.chart.markDirty();
    }
  }

  showSeverityLayer(): void {
    if (this.severitySeries && this.severityHeatLegend) {
      this.severitySeries.show();
      this.severityHeatLegend.show();
      this.chart.markDirty();
      this.severityHeatLegend.parent?.toFront();
    }
  }

  hideSeverityLayer(): void {
    if (this.severitySeries && this.severityHeatLegend) {
      this.severitySeries.hide();
      this.severityHeatLegend.hide();
      this.chart.markDirty();
    }
  }

  showCaseHeatmapLayer(): void {
    if (this.caseHeatmapSeries && this.caseHeatmapLegend) {
      this.caseHeatmapSeries.show();
      this.caseHeatmapLegend.show();
      this.chart.markDirty();
      this.caseHeatmapLegend.parent?.toFront();
    }
  }

  hideCaseHeatmapLayer(): void {
    if (this.caseHeatmapSeries && this.caseHeatmapLegend) {
      this.caseHeatmapSeries.hide();
      this.caseHeatmapLegend.hide();
      this.chart.markDirty();
    }
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
    showBase ? this.showBaseLayer() : this.hideBaseLayer();
    showHighlight ? this.showHighlightLayer() : this.hideHighlightLayer();
    showPoints ? this.showPointLayer() : this.hidePointLayer();

    if (showHumidity) {
      this.hidePrecipitationLayer();
      this.hideTemperatureLayer();
      this.hideSeverityLayer();
      this.hideCaseHeatmapLayer();
      this.showHumidityLayer();
      this.chart.get("background")?.set("fill", am5.color("#D0F4FC"));
    }
    if (showTemperature) {
      this.hidePrecipitationLayer();
      this.hideHumidityLayer();
      this.hideSeverityLayer();
      this.hideCaseHeatmapLayer();
      this.showTemperatureLayer();
      this.chart.get("background")?.set("fill", am5.color("#D0F4FC"));
    }
    if (showSeverity) {
      this.hidePrecipitationLayer();
      this.hideHumidityLayer();
      this.hideTemperatureLayer();
      this.hideCaseHeatmapLayer();
      this.showSeverityLayer();
      this.chart.get("background")?.set("fill", am5.color("#D0F4FC"));
    }
    if (showPrecipitation) {
      this.hideHumidityLayer();
      this.hideTemperatureLayer();
      this.hideSeverityLayer();
      this.hideCaseHeatmapLayer();
      this.showPrecipitationLayer();
      this.chart.get("background")?.set("fill", am5.color("#D0F4FC"));
    }
    if (showCaseHeatmap) {
      this.hideHumidityLayer();
      this.hideTemperatureLayer();
      this.hideSeverityLayer();
      this.hidePrecipitationLayer();
      this.showCaseHeatmapLayer();
      this.chart.get("background")?.set("fill", am5.color("#FFF7F7"));
    }
    if (!showHumidity && !showTemperature && !showSeverity && !showPrecipitation && !showCaseHeatmap) {
      this.hideHumidityLayer();
      this.hideTemperatureLayer();
      this.hideSeverityLayer();
      this.hidePrecipitationLayer();
      this.hideCaseHeatmapLayer();
      this.chart.get("background")?.set("fill", am5.color("#E0E0E0"));
    }
  }

  populateProvinceHumidityData(provinceHumidityData: ProvinceData[]): void {
    if (!this.humiditySeries) return;
    this.provinceHumidityData = provinceHumidityData;
    this.humiditySeries.data.clear();
    provinceHumidityData.forEach((data) => {
      this.humiditySeries!.data.push({
        id: data.id,
        value: data.value,
      });
    });
  }

  populateProvincePrecipitationData(provincePrecipitationData: ProvinceData[]): void {
    if (!this.precipitationSeries) return;
    this.provincePrecipitationData = provincePrecipitationData;
    this.precipitationSeries.data.clear();
    provincePrecipitationData.forEach((data) => {
      this.precipitationSeries!.data.push({
        id: data.id,
        value: this.classifyPrecipitationPattern(data.value),
      });
    });
  }

  populateProvinceTemperatureData(provinceTemperatureData: ProvinceData[]): void {
    if (!this.temperatureSeries) return;
    this.provinceTemperatureData = provinceTemperatureData;
    this.temperatureSeries.data.clear();
    provinceTemperatureData.forEach((data) => {
      this.temperatureSeries!.data.push({
        id: data.id,
        value: data.value,
      });
    });
  }

  populateProvinceSeverityData(provinceSeverityData: ProvinceData[]): void {
    if (!this.severitySeries) return;
    this.provinceSeverityData = provinceSeverityData;
    this.severitySeries.data.clear();
    provinceSeverityData.forEach((data) => {
      this.severitySeries!.data.push({
        id: data.id,
        value: data.status,
      });
    });
  }

  populateProvinceCaseHeatmapData(provinceCaseHeatmapData: ProvinceData[]): void {
    if (!this.caseHeatmapSeries) return;
    this.provinceCaseHeatmapData = provinceCaseHeatmapData;
    this.caseHeatmapSeries.data.clear();
    provinceCaseHeatmapData.forEach((data) => {
      this.caseHeatmapSeries!.data.push({
        id: data.id,
        value: Number(data.value) || 0,
      });
    });
  }

  private classifyPrecipitationPattern(precipitationValue: string | number): string {
    const value =
      typeof precipitationValue === "string"
        ? parseFloat(precipitationValue)
        : precipitationValue;

    if (value < 100) return "Lokal";
    if (value >= 100 && value < 200) return "Multipattern";
    if (value >= 200 && value < 300) return "Monsoon";
    if (value >= 300 && value < 400) return "Equatorial";
    return "Lainnya";
  }
}
