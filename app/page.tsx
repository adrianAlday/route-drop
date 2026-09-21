import { decode } from "@googlemaps/polyline-codec";
import HomeMap, { Route } from "./_components/HomeMap";
import { Params } from "./_utils/types";
import * as turf from "@turf/turf";

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

        const lineString = turf.lineString(
          turf.cleanCoords(
            turf.lineString(
              coordinates.map((coordinate) => coordinate.reverse()),
            ),
          ).geometry.coordinates,
        );

        return {
          id,
          title,
          stats,
          coordinate,
          elevations,
          coordinates,
          lineString,
        };
      })

      .catch((error) => {
        console.error(`Route Error: ${error}`);
      });

  const routeData = (
    (resolvedParams.r
      ? await Promise.all(
          (resolvedParams.r as string)
            .split(",")
            .map((routeId: string) => getRoute(routeId)),
        )
      : []) as Route[]
  ).sort((a, b) => b.stats.distance - a.stats.distance);

  return (
    <main>
      {routeData.length ? <HomeMap routeData={routeData} /> : <div />}
    </main>
  );
};

export default HomePage;

// opengraph image uses titles
// if url has no routes, root is wizard to generate urls
// serverside loader
