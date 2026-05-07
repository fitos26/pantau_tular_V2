import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_indonesiaHigh from "@amcharts/amcharts5-geodata/indonesiaHigh";
import { getTooltip } from "../../utils/tooltipUtils";
import { TEMPERATURE_COLORS } from "../../types";

type ColorMappingFunction = (sprite: am5.Sprite, min: any, max: any, value: any) => void;

const humidityColorMap: Record<string, string> = {
  "0": "#C41A0A",
  "10": "#F4440B",
  "20": "#F47A0B",
  "30": "#F4B00B",
  "40": "#F4E60B",
  "50": "#D2EE3C",
  "60": "#AFF474",
  "70": "#A3D4FF",
  "80": "#6DBCFF",
  "90": "#1392FF",
  "91+": "#00528F",
  default: "#FFFFFF",
};

const precipitationColorMap: Record<string, string> = {
  Lokal: "#DC3545",
  Multipattern: "#E35D6A",
  Monsoon: "#FFC107",
  Equatorial: "#3CB371",
  Lainnya: "#B8B8B8",
  default: "#FFFFFF",
};

const temperatureColorMap: Record<string, string> = Object.entries(TEMPERATURE_COLORS).reduce(
  (acc, [temp, color]) => {
    acc[temp.toString()] = color;
    return acc;
  },
  { default: "#FFFFFF" } as Record<string, string>
);

const severityColorMap: Record<string, string> = {
  katastropik: "#DC3545",
  bahaya: "#FD7E14",
  biasa: "#FFC107",
  minimal: "#CACBCB",
  default: "#FFFFFF",
};

const caseHeatmapColors = ["#FFF5F5", "#FECACA", "#F87171", "#DC2626", "#7F1D1D"];

export class SeriesFactory {
  private readonly root: am5.Root;
  private readonly chart: am5map.MapChart;

  constructor(root: am5.Root, chart: am5map.MapChart) {
    this.root = root;
    this.chart = chart;
  }

  private createBaseMapSeries(options: {
    valueField?: string;
    calculateAggregates?: boolean;
  } = {}): am5map.MapPolygonSeries {
    return this.chart.series.push(
      am5map.MapPolygonSeries.new(this.root, {
        geoJSON: am5geodata_indonesiaHigh,
        exclude: ["AQ"],
        valueField: options.valueField,
        calculateAggregates: options.calculateAggregates,
      })
    );
  }

  private applyPolygonStyle(
    series: am5map.MapPolygonSeries,
    options: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      fillOpacity?: number;
    } = {}
  ): void {
    series.mapPolygons.template.setAll({
      fill: am5.color(options.fill ?? "#FFFFFF"),
      stroke: am5.color(options.stroke ?? "#CCCCCC"),
      strokeWidth: options.strokeWidth ?? 0.5,
      fillOpacity: options.fillOpacity ?? 1,
      tooltipText: "{name}: {value}",
    });
  }

  private applyHeatRules(
    series: am5map.MapPolygonSeries,
    customFunction: ColorMappingFunction
  ): void {
    series.set("heatRules", [
      {
        target: series.mapPolygons.template,
        dataField: "value",
        customFunction,
      },
    ]);
  }

  private createLayerSeries(colorMappingFn: ColorMappingFunction): am5map.MapPolygonSeries {
    const series = this.createBaseMapSeries({
      valueField: "value",
      calculateAggregates: true,
    });

    this.applyPolygonStyle(series, { fillOpacity: 0.8 });
    this.applyHeatRules(series, colorMappingFn);
    series.hide();
    return series;
  }

  private getNumericRangeColor(value: number, colorMap: Record<string, string>): string {
    const keys = Object.keys(colorMap)
      .filter((key) => key !== "default" && !key.includes("+"))
      .map(Number)
      .sort((a, b) => a - b);

    const highestKey = Math.max(...keys);
    if (value > highestKey && colorMap[`${highestKey + 1}+`]) {
      return colorMap[`${highestKey + 1}+`];
    }

    for (const threshold of keys) {
      if (value <= threshold) {
        return colorMap[threshold.toString()];
      }
    }

    return colorMap.default;
  }

  createBasePolygonSeries(): am5map.MapPolygonSeries {
    const series = this.createBaseMapSeries();
    this.applyPolygonStyle(series);
    return series;
  }

  createHighlightSeries(): am5map.MapPolygonSeries {
    const series = this.createBaseMapSeries();
    this.applyPolygonStyle(series, {
      fill: "#E0E0E0",
      fillOpacity: 0.3,
      stroke: "#999999",
      strokeWidth: 1,
    });
    return series;
  }

  createHumiditySeries(): am5map.MapPolygonSeries {
    return this.createLayerSeries((sprite: am5.Sprite, _min, _max, value) => {
      const color = this.getNumericRangeColor(value, humidityColorMap);
      (sprite as am5.Graphics).set("fill", am5.color(color));
    });
  }

  createPrecipitationSeries(): am5map.MapPolygonSeries {
    return this.createLayerSeries((sprite: am5.Sprite, _min, _max, value) => {
      const color = precipitationColorMap[value] || precipitationColorMap.default;
      (sprite as am5.Graphics).set("fill", am5.color(color));
    });
  }

  createTemperatureSeries(): am5map.MapPolygonSeries {
    return this.createLayerSeries((sprite: am5.Sprite, _min, _max, value) => {
      const color = this.getNumericRangeColor(value, temperatureColorMap);
      (sprite as am5.Graphics).set("fill", am5.color(color));
    });
  }

  createSeveritySeries(): am5map.MapPolygonSeries {
    return this.createLayerSeries((sprite: am5.Sprite, _min, _max, value) => {
      const color = severityColorMap[value] || severityColorMap.default;
      (sprite as am5.Graphics).set("fill", am5.color(color));
    });
  }

  createCaseHeatmapSeries(): am5map.MapPolygonSeries {
    return this.createLayerSeries((sprite: am5.Sprite, min, max, value) => {
      const numericValue = Number(value) || 0;
      const numericMin = Number.isFinite(Number(min)) ? Number(min) : 0;
      const numericMax = Number.isFinite(Number(max)) ? Number(max) : numericValue;
      const range = Math.max(1, numericMax - numericMin);
      const ratio = Math.max(0, Math.min(1, (numericValue - numericMin) / range));
      const colorIndex = Math.min(
        caseHeatmapColors.length - 1,
        Math.floor(ratio * caseHeatmapColors.length)
      );

      (sprite as am5.Graphics).set("fill", am5.color(caseHeatmapColors[colorIndex]));
    });
  }

  createPointSeries(): am5map.MapPointSeries {
    const series = this.chart.series.push(am5map.MapPointSeries.new(this.root, {}));

    const tooltip = am5.Tooltip.new(this.root, {
      getFillFromSprite: false,
      background: am5.Rectangle.new(this.root, {
        fill: am5.color(0xffffff),
        fillOpacity: 0,
      }),
      labelText: "",
      autoTextColor: false,
      interactive: true,
    });

    let closeHandler: ((event: Event) => void) | null = null;

    const registerTooltipCloser = () => {
      if (closeHandler) {
        document.removeEventListener("click", closeHandler);
      }

      closeHandler = (event: Event) => {
        const target = event.target as HTMLElement | null;
        if (!target) {
          return;
        }

        const closeButton = target.closest("[data-tooltip-close]");
        if (closeButton) {
          event.preventDefault();
          event.stopPropagation();
          tooltip.hide();
          if (closeHandler) {
            document.removeEventListener("click", closeHandler);
            closeHandler = null;
          }
          return;
        }

        const tooltipElement = (tooltip as any)._display?.dom;
        if (tooltipElement && !tooltipElement.contains(target)) {
          tooltip.hide();
          if (closeHandler) {
            document.removeEventListener("click", closeHandler);
            closeHandler = null;
          }
        }
      };

      setTimeout(() => {
        if (closeHandler) {
          document.addEventListener("click", closeHandler);
        }
      }, 100);
    };

    series.bullets.push((root, _series, dataItem) => {
      const dataContext = (dataItem?.dataContext || {}) as {
        id?: string;
        case_id?: string | null;
        item_type?: "marker" | "cluster";
        cluster_count?: number;
        total_news?: number;
        province?: string;
        latitude?: number;
        longitude?: number;
      };

      if (dataContext.item_type === "cluster") {
        const container = am5.Container.new(root, {
          cursorOverStyle: "pointer",
        });

        container.children.push(
          am5.Circle.new(root, {
            radius: 10,
            tooltipY: 0,
            fill: am5.color("#ff1744"),
            stroke: am5.color("#ffffff"),
            strokeWidth: 1.5,
          })
        );
        container.children.push(
          am5.Circle.new(root, {
            radius: 16,
            fillOpacity: 0.2,
            tooltipY: 0,
            fill: am5.color("#ff1744"),
          })
        );
        container.children.push(
          am5.Circle.new(root, {
            radius: 22,
            fillOpacity: 0.08,
            tooltipY: 0,
            fill: am5.color("#ff1744"),
          })
        );
        container.children.push(
          am5.Label.new(root, {
            centerX: am5.p50,
            centerY: am5.p50,
            fill: am5.color(0xffffff),
            fontSize: "11",
            fontWeight: "600",
            text: String(dataContext.cluster_count || 0),
          })
        );

        container.events.on("pointerover", () => {
          tooltip.set(
            "html",
            `<div class="bg-white p-3 rounded-lg shadow-lg border"><div class="font-semibold">${dataContext.cluster_count || 0} kasus</div><div>${dataContext.total_news || 0} berita</div><div>${dataContext.province || "Cluster"}</div></div>`
          );
          tooltip.show();
          registerTooltipCloser();
        });

        container.events.on("click", () => {
          if (
            typeof dataContext.latitude === "number" &&
            typeof dataContext.longitude === "number"
          ) {
            const nextZoom = Math.min(Number(this.chart.get("zoomLevel") || 3) + 2, 8);
            this.chart.zoomToGeoPoint(
              { latitude: dataContext.latitude, longitude: dataContext.longitude },
              nextZoom,
              true
            );
          }
        });

        return am5.Bullet.new(root, { sprite: container });
      }

      const circle = am5.Circle.new(root, {
        radius: 5,
        tooltipY: 0,
        fill: am5.color("#ff1744"),
        stroke: am5.color("#ffffff"),
        strokeWidth: 1,
        cursorOverStyle: "pointer",
      });

      const container = am5.Container.new(root, {
        cursorOverStyle: "pointer",
      });

      container.children.push(
        am5.Circle.new(root, {
          radius: 10,
          fill: am5.color("#ff1744"),
          fillOpacity: 0.14,
          tooltipY: 0,
        })
      );
      container.children.push(circle);

      container.events.on("click", async () => {
        try {
          const caseId = dataContext.case_id || dataContext.id;
          if (!caseId) {
            return;
          }

          const tooltipHtml = await getTooltip({ id: caseId });
          tooltip.set("html", tooltipHtml);
          tooltip.show();
          registerTooltipCloser();
        } catch (error) {
          console.error("Error showing tooltip:", error);
        }
      });

      return am5.Bullet.new(root, { sprite: container });
    });

    series.set("tooltip", tooltip);
    return series;
  }

  createLocationSeries(): am5map.MapPointSeries {
    const series = this.chart.series.push(am5map.MapPointSeries.new(this.root, {}));

    series.bullets.push(() =>
      am5.Bullet.new(this.root, {
        sprite: am5.Circle.new(this.root, {
          radius: 8,
          fill: am5.color("#2196F3"),
          strokeWidth: 2,
          stroke: am5.color("#FFFFFF"),
        }),
      })
    );

    series.bullets.push(() =>
      am5.Bullet.new(this.root, {
        sprite: am5.Circle.new(this.root, {
          radius: 12,
          fill: am5.color("#2196F3"),
          fillOpacity: 0.3,
        }),
      })
    );

    return series;
  }
}
