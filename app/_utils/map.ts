import { Map } from "maplibre-gl";

export const minZoom = 1; // zoom out limit

export const maxZoom = 18; // zoom in limit

export const essential = true;

export const getById = (id: string) =>
  document.getElementById(id) as HTMLElement;

export const setupMap = (mapInstance: Map) => {
  mapInstance.setStyle("https://tiles.openfreemap.org/styles/positron", {
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
