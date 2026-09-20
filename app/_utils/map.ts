import * as maplibreGl from "maplibre-gl";
import { Map, SourceSpecification } from "maplibre-gl";
import maplibreContour from "maplibre-contour";

export const zoom = 16;

export const minZoom = 1;

export const getById = (id: string) =>
  document.getElementById(id) as HTMLElement;

export const setupMap = (mapInstance: Map) => {
  mapInstance.setStyle("https://tiles.openfreemap.org/styles/bright", {
    transformStyle: (_previousStyle, nextStyle) => {
      const mapterhornSource = {
        type: "raster-dem",
        url: "https://tiles.mapterhorn.com/tilejson.json",
      } as SourceSpecification;

      nextStyle.sources.hillshadeSource = mapterhornSource;
      nextStyle.layers.push({
        id: "hills",
        type: "hillshade",
        source: "hillshadeSource",
        layout: { visibility: "visible" },
        paint: { "hillshade-shadow-color": "rgb(71,59,36)" },
      });

      nextStyle.sources.terrainSource = mapterhornSource;
      nextStyle.terrain = {
        source: "terrainSource",
      };

      const demSource = new maplibreContour.DemSource({
        url: "https://tiles.mapterhorn.com/{z}/{x}/{y}.webp",
        maxzoom: 13,
        worker: true,
        cacheSize: 100,
        timeoutMs: 10_000,
      });
      demSource.setupMaplibre(maplibreGl);

      nextStyle.sources.contourSource = {
        type: "vector",
        tiles: [
          demSource.contourProtocolUrl({
            multiplier: 3.28084,
            thresholds: {
              1: [10, 100],
            },
            contourLayer: "contours",
            elevationKey: "ele",
            levelKey: "level",
            extent: 4096,
            buffer: 1,
          }),
        ],
        maxzoom: 15,
      };
      nextStyle.layers.push({
        id: "contourLines",
        type: "line",
        source: "contourSource",
        "source-layer": "contours",
        paint: {
          "line-color": "rgba(71,59,36,0.33)",
          "line-width": ["match", ["get", "level"], 1, 1, 0.5],
        },
      });
      nextStyle.layers.push({
        id: "contourLabels",
        type: "symbol",
        source: "contourSource",
        "source-layer": "contours",
        filter: [">", ["get", "level"], 0],
        layout: {
          "symbol-placement": "line",
          "text-size": 12,
          "text-field": ["concat", ["number-format", ["get", "ele"], {}], "'"],
          "text-font": ["-apple-system", "BlinkMacSystemFont", "sans-serif"],
        },
        paint: {
          "text-color": "rgba(71,59,36,0.66)",
          "text-halo-color": "rgba(247,248,250,0.66)",
          "text-halo-width": 0.66,
        },
      });

      // fallback
      // recent issue: https://github.com/hyperknot/openfreemap/issues/112

      // nextStyle.sources.openmaptiles = {
      //   type: "vector",
      //   tiles: [
      //     "https://tiles.openfreemap.org/planet/20260513_001001_pt/{z}/{x}/{y}.pbf",
      //   ],
      //   minzoom: 0,
      //   maxzoom: 14,
      // };

      return nextStyle;
    },
  });
  mapInstance.dragRotate.disable();
  mapInstance.touchZoomRotate.disableRotation();
  mapInstance.keyboard.disable();

  mapInstance.setMaxPitch(0);
  mapInstance.touchPitch.disable();
};
