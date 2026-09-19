import HomeMap from "./_components/HomeMap";

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
      .catch((error) => {
        console.error(`Route Error: ${error}`);
      });

  const routeData = await Promise.all(
    (resolvedParams.r as string)
      .split(",")
      .map((routeId: string) => getRoute(routeId)),
  );

  return (
    <main>
      <HomeMap />
    </main>
  );
};

export default HomePage;
