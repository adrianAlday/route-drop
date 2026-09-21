"use client";

import { useState, useEffect } from "react";
import Bouncer from "./Bouncer";
import { LatLngTuple } from "@googlemaps/polyline-codec";
import { getById, zoom, minZoom, maxZoom, setupMap } from "../_utils/map";
import * as maplibreGl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import { centerMean, featureCollection, point } from "@turf/turf";

export type Route = {
  id: string;
  title: string;
  stats: { [key: string]: number };
  coordinate: [number, number];
  coordinates: LatLngTuple[];
  elevations: LatLngTuple[];
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

    const center = centerMean(
      featureCollection(routeData.map((route) => point(route.coordinates[0]))),
    ).geometry.coordinates.reverse() as [number, number];

    const initialCoordinates = center;

    const initialPosition = {
      center: initialCoordinates,
      zoom,
    };

    const mapInstance = new maplibreGl.Map({
      container: mapContainerId,
      ...initialPosition,
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

    mapInstance.on("load", () => {
      mapInstance.setProjection({
        type: "globe",
      });

      routeData.forEach((route, index) => {
        const cleanGeoJson = turf.cleanCoords(
          turf.lineString(
            route.coordinates.map((coordinate) => coordinate.reverse()),
          ),
        ).geometry.coordinates;

        const fitGeoJson = () => {
          mapInstance.fitBounds(
            cleanGeoJson.reduce(
              (
                bounds: maplibreGl.LngLatBounds,
                coordinates: [number, number],
              ) => bounds.extend(coordinates),
              new maplibreGl.LngLatBounds(
                initialCoordinates,
                initialCoordinates,
              ),
            ),
            {
              padding: { top: 36, bottom: 16, left: 16, right: 16 + 32 + 16 },
              maxZoom,
            },
          );
        };

        fitGeoJson();

        const lineString = turf.lineString(cleanGeoJson);

        const meterUnitsOptions = {
          units: "meters" as turf.helpers.Units,
        };

        const totalMeters = turf.length(lineString, meterUnitsOptions);

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
            lineString,
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

        mapInstance.once("idle", async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000 * 1));

          const routeSourceName = `routeSource ${route.id}`;

          mapInstance.addSource(routeSourceName, {
            type: "geojson",
            data: featureCollection,
          });

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
              "line-color": [
                "rgb(80%,25%,20%)",
                "rgb(25%,80%,25%)",
                "rgb(25%,25%,80%)",
              ][index],
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
            coordinates: turf.along(lineString, mile, {
              units: "miles",
            }).geometry.coordinates,
          }));

          miles.forEach((mile) => {
            const mileMarkerElement = document.createElement("div");
            mileMarkerElement.textContent = `${mile.mile}`;
            mileMarkerElement.style.fontSize = "16px";
            mileMarkerElement.style.fontFamily =
              "-apple-system, BlinkMacSystemFont, sans-serif";
            mileMarkerElement.style.color = "rgba(38,41,46,0.66)";
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
