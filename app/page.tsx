import { Params } from "./_utils/types";
import RouteMap from "./_components/RouteMap";
import Builder from "./_components/Builder";
import { getData } from "./_utils/getData";

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
      {routeData.length ? <RouteMap routeData={routeData} /> : <Builder />}
    </main>
  );
};

export default HomePage;

// once over
// fit to whole map when turning off location?
// end symbol?
