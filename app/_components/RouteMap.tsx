"use client";

import { LatLngTuple } from "@googlemaps/polyline-codec";
import type { Feature, LineString } from "geojson";
import { useState, useEffect } from "react";
import { getById, minZoom, maxZoom, setupMap, essential } from "../_utils/map";
import * as maplibreGl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import { darkBlue, lightGray, routeColors } from "../_utils/colors";
import Bouncer from "./Bouncer";

export type Route = {
  id: string;
  title: string;
  stats: { [key: string]: number };
  coordinate: [number, number];
  coordinates: LatLngTuple[];
  elevations: LatLngTuple[];
  lineString: Feature<LineString>;
};

type RouteMapProps = {
  routeData: Route[];
};

const RouteMap = ({ routeData }: RouteMapProps) => {
  const [loading, setLoading] = useState(true);

  const mapContainerId = "map";

  useEffect(() => {
    if (!getById(mapContainerId)) {
      return;
    }

    const mapInstance = new maplibreGl.Map({
      container: mapContainerId,
      center: turf.centerMean(
        turf.featureCollection(
          routeData.map((route) => turf.point(route.coordinates[0])),
        ),
      ).geometry.coordinates as [number, number],
      minZoom,
      zoom: maxZoom,
      attributionControl: false,
      localIdeographFontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      // hash: true,
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

    mapInstance.once("load", () => {
      mapInstance.setProjection({
        type: "globe",
      });

      routeData.forEach((route, index) => {
        const routeSourceName = `routeSource-${route.id}`;

        mapInstance.addSource(routeSourceName, {
          type: "geojson",
          data: route.lineString,
        });

        const routeLayerOptions = {
          type: "line",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
        };

        mapInstance.addLayer({
          source: routeSourceName,
          id: `routeLayer-${route.id}-shadow`,
          paint: {
            "line-width": 4,
            "line-color": darkBlue,
          },
          ...routeLayerOptions,
        } as maplibreGl.AddLayerObject);

        const routeColor = routeColors[index];

        mapInstance.addLayer({
          source: routeSourceName,
          id: `routeLayer-${route.id}`,

          paint: {
            "line-width": 2,
            "line-color": routeColor,
          },
          ...routeLayerOptions,
        } as maplibreGl.AddLayerObject);

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
          (_value, index) => index,
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
            mileMarkerElement.style.color = isStart ? darkBlue : routeColor;
            mileMarkerElement.style.fontSize = "16px";
            mileMarkerElement.style.fontFamily =
              "-apple-system, BlinkMacSystemFont, sans-serif";
            mileMarkerElement.style.fontWeight = "1000";
            mileMarkerElement.style.textShadow = Array.from(
              {
                length: 8,
              },
              (_value, index) => index + 1,
            )
              .map((number) => `0 0 ${number}px ${lightGray}`)
              .join(", ");
            mileMarkerElement.className = "marker";

            new maplibreGl.Marker({
              element: mileMarkerElement,
            })
              .setLngLat(marker.coordinates as [number, number])
              .addTo(mapInstance);
          });
      });

      mapInstance.resize();

      mapInstance.once("idle", () => {
        const boundingBox = turf.bbox(
          turf.featureCollection(routeData.map((route) => route.lineString)),
        );

        const controlMargin = 10;
        const controlSize = 30;

        mapInstance.fitBounds(
          [
            [boundingBox[0], boundingBox[1]],
            [boundingBox[2], boundingBox[3]],
          ],
          {
            padding: controlMargin + controlSize + controlMargin,
            maxZoom,
            essential,
          },
        );
      });

      setLoading(false);
    });
  }, []);

  return (
    <div className="w-dvw">
      <Bouncer classNames={loading ? "block" : "hidden"} />

      <div className={`relative ${loading ? "hidden" : "block"}`}>
        <div id={mapContainerId} className={"h-dvh"} />

        <style>
          {`
          .marker {
            -webkit-text-stroke: 1px ${darkBlue}
        `}
        </style>
      </div>
    </div>
  );
};

export default RouteMap;
