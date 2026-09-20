"use client";

import { useState, useEffect } from "react";
import Bouncer from "./Bouncer";
import { LatLngTuple } from "@googlemaps/polyline-codec";

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

  useEffect(() => {}, []);

  return (
    <div className="w-dvw">
      <Bouncer classNames={loading ? "block" : "hidden"} />

      <div className={`${loading ? "hidden" : "block"} relative`}>asdf</div>
    </div>
  );
};

export default HomeMap;
