import { decode } from "@googlemaps/polyline-codec";
import HomeMap, { Route } from "./_components/HomeMap";

import { Params } from "./_utils/types";

type HomePageProps = {
  searchParams: Promise<Params>;
};

const HomePage = async ({ searchParams }: HomePageProps) => {
  const resolvedParams = { ...(await searchParams) };

  const getRoute = async (id: string) =>
    await fetch(`https://api.footpathapp.com/v2/routes/${id}`, {
      next: { revalidate: 60 * 60 },
    })
      .then(async (response) => await response.json())
      .then(async (json) => {
        const { id, title, stats, geometry } = json;

        const { coordinate } = geometry;

        const elevations = decode(geometry.elevations);

        const coordinates = decode(geometry.polyline);

        return {
          id,
          title,
          stats,
          coordinate,
          elevations,
          coordinates,
        };
      })

      .catch((error) => {
        console.error(`Route Error: ${error}`);
      });

  const routeData = (
    (await Promise.all(
      (resolvedParams.r as string)
        .split(",")
        .map((routeId: string) => getRoute(routeId)),
    )) as Route[]
  ).sort((a, b) => a.stats.distance - b.stats.distance);

  return (
    <main>
      <HomeMap routeData={routeData} />
    </main>
  );
};

export default HomePage;
