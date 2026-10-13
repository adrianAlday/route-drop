import { Params } from "./_utils/types";
import RouteMap from "./_components/RouteMap";
import Builder from "./_components/Builder";
import { getData } from "./_utils/getData";
import { events } from "./_utils/events";
import { routeColors } from "./_utils/colors";

type HomePageProps = {
  searchParams: Promise<Params>;
};

export const generateMetadata = async ({ searchParams }: HomePageProps) => {
  const resolvedParams = { ...(await searchParams) };
  const routeData = await getData(resolvedParams);

  return {
    title: `Route Drop ${routeData.length ? "-" : ""} ${routeData.map((route) => route.title).join(", ")}`,
    openGraph: {
      images: [`/api/opengraph-image?r=${resolvedParams.r}`],
    },
  };
};

const HomePage = async ({ searchParams }: HomePageProps) => {
  const resolvedParams = { ...(await searchParams) };
  const routeData = await getData(resolvedParams);

  return (
    <main>
      {routeData.length ? (
        <RouteMap
          routeData={routeData}
          routeColors={
            (events as { [key: string]: { colors?: string[] } })[
              (resolvedParams.e as string) || ""
            ]?.colors || routeColors
          }
        />
      ) : (
        <Builder />
      )}
    </main>
  );
};

export default HomePage;
