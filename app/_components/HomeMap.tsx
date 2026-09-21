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

    const meterUnitsOptions = {
      units: "meters" as turf.helpers.Units,
    };

    const routeColors = ["rgb(234,57,128)", "rgb(0,234,0)", "rgb(57,128,234)"];

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
            "line-width": 2,
            "line-color": routeColor,
          },
        });

        const totalMeters = turf.length(route.lineString, meterUnitsOptions);

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
      });

      mapInstance.jumpTo(boundingCamera);

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
