import { Map } from "maplibre-gl";

export const zoom = 16;

export const minZoom = 1;

export const maxZoom = 18;

export const getById = (id: string) =>
  document.getElementById(id) as HTMLElement;

export const setupMap = (mapInstance: Map) => {
  mapInstance.setStyle("https://tiles.openfreemap.org/styles/bright", {
    transformStyle: (_previousStyle, nextStyle) => {
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
