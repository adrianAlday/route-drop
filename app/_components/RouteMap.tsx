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

type FixedDeviceOrientationEvent = DeviceOrientationEvent & {
  requestPermission: () => Promise<"granted" | "denied">;
};

type RouteMapProps = {
  routeData: Route[];
};

const RouteMap = ({ routeData }: RouteMapProps) => {
  const [loading, setLoading] = useState(true);

  const mapContainerId = "map";

  useEffect(() => {
    if (
      !getById(mapContainerId) ||
      document.getElementsByClassName("maplibregl-canvas-container")[0]
    ) {
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
      zoom: 16,
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
      trackUserLocation: true,
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
            mileMarkerElement.style.fontSize = "16px";
            mileMarkerElement.style.fontFamily =
              "-apple-system, BlinkMacSystemFont, sans-serif";
            mileMarkerElement.style.fontWeight = "1000";
            mileMarkerElement.style.color = isStart ? darkBlue : routeColor;
            mileMarkerElement.style.webkitTextStrokeWidth = "1px";
            mileMarkerElement.style.webkitTextStrokeColor = isStart
              ? routeColor
              : darkBlue;
            mileMarkerElement.style.textShadow = Array.from(
              {
                length: 8,
              },
              (_value, index) => index + 1,
            )
              .map((number) => `0 0 ${number}px ${lightGray}`)
              .join(", ");

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

      const geolocateButton = document.querySelector(
        ".maplibregl-ctrl-geolocate",
      ) as HTMLButtonElement;
      geolocateButton.innerHTML = `<div id="geolocate-icon-wrapper" style="padding: 12px; color: ${darkBlue}; border: 2px solid ${darkBlue}; border-radius: 50%;"><svg viewBox="0 0 25.7941 23.9347" xmlns="http://www.w3.org/2000/svg"><g><path d="M2.13632 13.3502L10.4508 13.3677C10.568 13.3677 10.6148 13.4146 10.6148 13.5318L10.6266 21.8111C10.6266 24.2369 13.7555 24.7642 14.8101 22.4498L23.4 3.73493C24.5309 1.25055 22.6383-0.507262 20.1891 0.60602L1.42148 9.20172C-0.787507 10.2037-0.324616 13.3384 2.13632 13.3502Z" fill="currentColor" /></g></svg></div>`;

      const orientationBeamName = "orientation-beam";

      const setupOrientationBeam = (eventName: string) => {
        const beamPositionWrapper = document.createElement("div");
        const beamRotationWrapper = document.createElement("div");
        beamRotationWrapper.className = "beam-rotation-wrapper";
        const orientationBeam = document.createElement("div");
        orientationBeam.className = orientationBeamName;
        orientationBeam.id = orientationBeamName;

        beamPositionWrapper
          .appendChild(beamRotationWrapper)
          .appendChild(orientationBeam);

        const defaultBeamLocation = [0, 90] as [number, number];

        const orientationBeamMarker = new maplibreGl.Marker({
          element: beamPositionWrapper,
        })
          .setLngLat([0, 90])
          .addTo(mapInstance);

        let lastOrientation = 0;

        geolocateControl.on("geolocate", (event) => {
          if (lastOrientation !== 0) {
            orientationBeamMarker.setLngLat([
              event.coords.longitude,
              event.coords.latitude,
            ]);
          }
        });

        new MutationObserver((mutationsList) => {
          for (const mutation of mutationsList) {
            if (
              mutation.attributeName === "class" &&
              ![
                "maplibregl-ctrl-geolocate-active",
                "maplibregl-ctrl-geolocate-background",
              ].some((className) =>
                (mutation.target as HTMLButtonElement).className.includes(
                  className,
                ),
              )
            ) {
              getById("geolocate-icon-wrapper").style.color = darkBlue;
              getById("geolocate-icon-wrapper").style.borderColor = darkBlue;

              orientationBeamMarker.setLngLat(defaultBeamLocation);
            }
          }
        }).observe(geolocateButton, { attributes: true });

        window.addEventListener(eventName, (event) => {
          const currentOrientation = event.timeStamp;

          if (currentOrientation - lastOrientation > 1000 / 60) {
            lastOrientation = currentOrientation;

            beamRotationWrapper.style.transform = `rotate(${360 - ((event as DeviceOrientationEvent).alpha || 0)}deg)`;
          }
        });
      };

      geolocateControl.on("trackuserlocationstart", () => {
        getById("geolocate-icon-wrapper").style.color = routeColors[0];
        getById("geolocate-icon-wrapper").style.borderColor = routeColors[0];

        if (!getById(orientationBeamName)) {
          if (
            typeof DeviceOrientationEvent !== "undefined" &&
            typeof (
              DeviceOrientationEvent as unknown as FixedDeviceOrientationEvent
            ).requestPermission === "function"
          ) {
            (DeviceOrientationEvent as unknown as FixedDeviceOrientationEvent)
              .requestPermission()
              .then((permissionState) => {
                if (permissionState === "granted") {
                  setupOrientationBeam("deviceorientation");
                }
              });
          } else if ("ondeviceorientationabsolute" in window) {
            setupOrientationBeam("ondeviceorientationabsolute");
          }
        }
      });

      setLoading(false);
    });
  }, []);

  const locationDotSize = 15;
  const orientationBeamSize = locationDotSize * 8;

  return (
    <div className="w-dvw">
      <Bouncer classNames={loading ? "block" : "hidden"} />

      <div className={`relative ${loading ? "hidden" : "block"}`}>
        <div id={mapContainerId} className={"h-dvh"} />

        <style>
          {`
            }
            .maplibregl-ctrl-group:not(:empty) {
              box-shadow: none;
            }
            .maplibregl-ctrl-group {
              border-radius: 50%;
              background: ${lightGray}
            }
            .maplibregl-ctrl-group button {
              height: 44px;
              width: 44px;
            }
            .maplibregl-ctrl-geolocate {
              border-radius: 50%;
            }
            .maplibregl-user-location-dot, .maplibregl-user-location-dot:before {
              background-color: ${routeColors[0]};
            }
            .maplibregl-user-location-dot:after {
              border: 1px solid ${darkBlue};
              top: -1px;
              left: -1px;
              height: 17px;
              width: 17px;
            }
            .maplibregl-user-location-accuracy-circle {
              background-color: rgba(234,57,128,0.33);
            }
            .beam-rotation-wrapper {
              width: 0px;
              height: 0px;
            }
            .orientation-beam {
              width: ${orientationBeamSize}px;
              height: ${orientationBeamSize / 2}px; 
              background: radial-gradient(
                circle at 50% 100%, 
                rgba(234,57,128,0.66) 00%, 
                rgba(234,57,128,0.33) 33%, 
                rgba(234,57,128,0.00) 66%
              );
              clip-path: polygon(50% 100%, 30% 0%, 70% 0%);
              transform: translate(-50%, -100%);
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default RouteMap;
