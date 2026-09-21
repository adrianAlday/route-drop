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

    mapInstance.addControl(geolocateControl, "top-right");

    mapInstance.addControl(
      new maplibreGl.NavigationControl({
        visualizePitch: false,
        visualizeRoll: false,
        showZoom: true,
        showCompass: false,
      }),
      "top-right",
    );

    const boundingBox = turf.bbox(
      turf.featureCollection(routeData.map((route) => route.lineString)),
    );

    const boundingCamera = mapInstance.cameraForBounds(
      [
        [boundingBox[0], boundingBox[1]],
        [boundingBox[2], boundingBox[3]],
      ],
      {
        padding: { top: 16, bottom: 16, left: 16, right: 16 + 32 + 16 },
        maxZoom,
      },
    ) as maplibreGl.CenterZoomBearing;

    mapInstance.on("load", () => {
      mapInstance.setProjection({
        type: "globe",
      });

      mapInstance.jumpTo(boundingCamera);

      routeData.forEach((route, index) => {
        const meterUnitsOptions = {
          units: "meters" as turf.helpers.Units,
        };

        const totalMeters = turf.length(route.lineString, meterUnitsOptions);

        let startDistance = 0;

        const segments = [];

        const terrainResolutionMeters = 10;

        const segmentMeters = terrainResolutionMeters * 5;

        while (startDistance < totalMeters) {
          let endDistance = startDistance + segmentMeters;

          if (endDistance > totalMeters) {
            endDistance = totalMeters;
          }

          const segment = turf.lineSliceAlong(
            route.lineString,
            startDistance,
            endDistance,
            meterUnitsOptions,
          );

          segment.properties = {
            distanceMeters: endDistance - startDistance,
            startDistance,
            endDistance,
          };

          segment.id = endDistance;

          segments.push(segment);

          startDistance = endDistance;
        }

        const featureCollection = turf.featureCollection(segments);

        const traceFeatureCollection = featureCollection;

        const routeSourceName = `routeSource ${route.id}`;

        mapInstance.addSource(routeSourceName, {
          type: "geojson",
          data: featureCollection,
        });

        const routeColor = [
          "rgb(80%,25%,20%)",
          "rgb(25%,80%,25%)",
          "rgb(25%,25%,80%)",
        ][index];

        mapInstance.addLayer({
          source: routeSourceName,
          id: `routeLayer ${route.id}`,
          type: "line",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-width": 2,
            "line-color": routeColor,
          },
        });

        const routeTraceSourceName = `routeTraceSource ${route.id}`;

        mapInstance.addSource(routeTraceSourceName, {
          type: "geojson",
          data: traceFeatureCollection,
        });

        mapInstance.addLayer({
          source: routeTraceSourceName,
          id: `routeTraceLayer ${route.id}`,
          type: "line",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-width": 2,
            "line-color": [
              "case",
              ["to-boolean", ["feature-state", "drawn"]],
              "rgb(240,246,252)",
              "transparent",
            ],
          },
        });

        mapInstance.once("idle", async () => {
          let animateCounter = 0;

          const refreshRate = 120;

          const targetSeconds = 1;

          const theoreticalChunkSize =
            featureCollection.features.length / (refreshRate * targetSeconds);

          const chunkSize = Math.floor(theoreticalChunkSize) || 1;

          const getChunkFeaturesStartIndex = (counterValue: number) =>
            (counterValue * chunkSize) % featureCollection.features.length;

          const getChunkFeatures = (startIndex: number) =>
            featureCollection.features.slice(
              startIndex,
              startIndex + chunkSize,
            );

          const miles = Array.from(
            {
              length: Math.floor(
                turf.convertLength(totalMeters, "meters", "miles"),
              ),
            },
            (_, index) => index + 1,
          ).map((mile) => ({
            mile,
            meters: turf.convertLength(mile, "miles", "meters"),
            coordinates: turf.along(route.lineString, mile, {
              units: "miles",
            }).geometry.coordinates,
          }));

          miles.forEach((mile) => {
            const mileMarkerElement = document.createElement("div");
            mileMarkerElement.textContent = `${mile.mile}`;
            mileMarkerElement.style.fontSize = "16px";
            mileMarkerElement.style.fontFamily =
              "-apple-system, BlinkMacSystemFont, sans-serif";
            mileMarkerElement.style.color = routeColor;
            mileMarkerElement.style.fontWeight = "500";
            mileMarkerElement.style.textShadow =
              "-1.5px -1.5px 1.5px rgba(247,248,250,0.66), 1.5px -1.5px 1.5px rgba(247,248,250,0.66), -1.5px  1.5px 1.5px rgba(247,248,250,0.66), 1.5px  1.5px 1.5px rgba(247,248,250,0.66)";

            new maplibreGl.Marker({
              element: mileMarkerElement,
            })
              .setLngLat(mile.coordinates as [number, number])
              .addTo(mapInstance);
          });

          const animateRoute = async () => {
            const startIndex = getChunkFeaturesStartIndex(animateCounter);

            const chunkFeatures = getChunkFeatures(startIndex);

            const lastChunkStartIndex = getChunkFeaturesStartIndex(
              animateCounter - 1,
            );

            const lastChunkFeatures = getChunkFeatures(lastChunkStartIndex);

            lastChunkFeatures.forEach((feature) => {
              mapInstance.setFeatureState(
                {
                  source: routeTraceSourceName,
                  id: feature.id,
                },
                { drawn: false },
              );
            });

            chunkFeatures.forEach((feature) => {
              mapInstance.setFeatureState(
                {
                  source: routeTraceSourceName,
                  id: feature.id,
                },
                { drawn: true },
              );
            });

            await new Promise((resolve) =>
              setTimeout(
                resolve,
                ((1000 * 1) / refreshRate) * (chunkSize / theoreticalChunkSize),
              ),
            );

            requestAnimationFrame(animateRoute);

            animateCounter = animateCounter + 1;
          };

          await new Promise((resolve) => setTimeout(resolve, 1000 * 0.1));
          animateRoute();
        });
      });

      setLoading(false);
    });
  }, [routeData]);

  return (
    <div className="w-dvw">
      <Bouncer classNames={loading ? "block" : "hidden"} />

      <div className={`${loading ? "hidden" : "block"} relative`}>
        <div id={mapContainerId} className={"h-dvh"} />
      </div>
    </div>
  );
};

export default HomeMap;
