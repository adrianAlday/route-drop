"use client";

import { useState, useEffect } from "react";
import Bouncer from "./Bouncer";
import { LatLngTuple } from "@googlemaps/polyline-codec";
import { getById, zoom, minZoom, setupMap } from "../_utils/map";
import { centerMean, featureCollection, point } from "@turf/turf";
import * as maplibreGl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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

    console.log("center", center);

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

    console.log("hiya");

    mapInstance.on("load", () => {
      mapInstance.setProjection({
        type: "globe",
      });

      setLoading(false);

      console.log("load");
    });

    console.log("end");
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
