"use client";

import { useState, useEffect } from "react";
import Bouncer from "./Bouncer";
import { LatLngTuple } from "@googlemaps/polyline-codec";
import { getById, zoom, minZoom, maxZoom, setupMap } from "../_utils/map";
import * as maplibreGl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import { centerMean, featureCollection, point } from "@turf/turf";
import type { Feature, LineString } from "geojson";

export type Route = {
  id: string;
  title: string;
  stats: { [key: string]: number };
  coordinate: [number, number];
  coordinates: LatLngTuple[];
  elevations: LatLngTuple[];
  lineString: Feature<LineString>;
};

type HomeMapProps = {
  routeData: Route[];
};

const HomeMap = ({ routeData }: HomeMapProps) => {
  const [loading, setLoading] = useState(true);

  const mapContainerId = "map";

  useEffect(() => {
    if (!getById(mapContainerId)) {
      return;
    }

    const mapInstance = new maplibreGl.Map({
      container: mapContainerId,
      center: centerMean(
        featureCollection(
          routeData.map((route) => point(route.coordinates[0])),
        ),
      ).geometry.coordinates.reverse() as [number, number],
      zoom,
      minZoom,
      attributionControl: false,
      localIdeographFontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    });

    setupMap(mapInstance);

    const geolocateControl = new maplibreGl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      showUserLocation: true,
      showAccuracyCircle: true,
    });

    mapInstance.addControl(geolocateControl, "bottom-right");

    const routeColors = [
      "rgb(234,57,128)",
      "rgb(217,252,82)",
      "rgb(57,128,234)",
    ];

    mapInstance.on("load", () => {
      mapInstance.setProjection({
        type: "globe",
      });

      routeData.forEach((route, index) => {
        const routeSourceName = `routeSource ${route.id}`;

        mapInstance.addSource(routeSourceName, {
          type: "geojson",
          data: route.lineString,
        });

        mapInstance.addLayer({
          source: routeSourceName,
          id: `routeLayer ${route.id} shadow`,
          type: "line",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-width": 6,
            "line-color": "rgb(1,8,43)",
          },
        });

        const routeColor = routeColors[index];

        mapInstance.addLayer({
          source: routeSourceName,
          id: `routeLayer ${route.id}`,
          type: "line",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-width": 4,
            "line-color": routeColor,
          },
        });

        Array.from(
          {
            length:
              Math.floor(
                turf.convertLength(
                  turf.length(route.lineString, {
                    units: "meters" as turf.helpers.Units,
                  }),
                  "meters",
                  "miles",
                ),
              ) + 1,
          },
          (_, index) => index,
        )
          .map((mile) => ({
            miles: mile,
            meters: turf.convertLength(mile, "miles", "meters"),
            coordinates: turf.along(route.lineString, mile, {
              units: "miles",
            }).geometry.coordinates,
          }))
          .forEach((marker) => {
            const isStart = marker.miles === 0;

            const mileMarkerElement = document.createElement("div");
            mileMarkerElement.textContent = isStart ? "★" : `${marker.miles}`;
            mileMarkerElement.style.fontSize = "16px";
            mileMarkerElement.style.fontFamily =
              "-apple-system, BlinkMacSystemFont, sans-serif";
            mileMarkerElement.style.color = isStart
              ? "rgb(1,8,43)"
              : routeColor;
            mileMarkerElement.style.fontWeight = "1000";
            mileMarkerElement.style.textShadow =
              "0 0 1px rgb(247,248,250), 0 0 2px rgb(247,248,250), 0 0 3px rgb(247,248,250), 0 0 4px rgb(247,248,250)";
            mileMarkerElement.className = "marker";

            new maplibreGl.Marker({
              element: mileMarkerElement,
            })
              .setLngLat(marker.coordinates as [number, number])
              .addTo(mapInstance);
          });
      });

      const boundingBox = turf.bbox(
        turf.featureCollection(routeData.map((route) => route.lineString)),
      );

      mapInstance.jumpTo(
        mapInstance.cameraForBounds(
          [
            [boundingBox[0], boundingBox[1]],
            [boundingBox[2], boundingBox[3]],
          ],
          {
            padding: { top: 16, bottom: 16, left: 16, right: 16 + 32 + 16 },
            maxZoom,
          },
        ) as maplibreGl.CenterZoomBearing,
      );

      setLoading(false);
    });
  }, [routeData]);

  return (
    <div className="w-dvw">
      <Bouncer classNames={loading ? "block" : "hidden"} />

      <style>
        {`
          .marker {
            -webkit-text-stroke: 1px rgb(1,8,43);
        `}
      </style>
      <div className={`${loading ? "hidden" : "block"} relative`}>
        <div id={mapContainerId} className={"h-dvh"} />
      </div>
    </div>
  );
};

export default HomeMap;
