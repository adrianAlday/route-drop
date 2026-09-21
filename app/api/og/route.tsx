// app/api/og/route.tsx
import { Route } from "@/app/_components/HomeMap";
import { routeColors } from "@/app/_utils/colors";
import { getRoute } from "@/app/page";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export const revalidate = 60 * 60;

const loadGoogleFont = async (font: string, weight: number, text: string) => {
  const url = `https://fonts.googleapis.com/css2?family=${font}:ital,wght@1,${weight}&text=${encodeURIComponent(text)}`;

  const css = await fetch(url).then((res) => res.text());

  const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);

  if (!match || !match[1]) {
    throw new Error("Font not found");
  }

  const fontUrl = match[1];

  return fetch(fontUrl).then((res) => res.arrayBuffer());
};

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    const r = searchParams.get("r");

    const title = "route drop";

    const lines = (
      (r
        ? await Promise.all(
            r.split(",").map((routeId: string) => getRoute(routeId)),
          )
        : []) as Route[]
    )
      .sort((a, b) => b.stats.distance - a.stats.distance)
      .map((route) => route.title);

    const montserratBold = await loadGoogleFont(
      "Montserrat",
      900,
      [title, ...lines].join(`\n`),
    );

    console.log("routeColors", routeColors);

    return new ImageResponse(
      <div
        style={{
          background: "rgb(1,8,43)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Montserrat",
          whiteSpace: "pre-wrap",
          letterSpacing: "-0.04em",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 128, color: "rgb(242, 243, 240)" }}>
            {title}
          </div>

          {lines.map((line, index) => (
            <div
              key={index}
              style={{ fontSize: 64, color: routeColors[index] }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Montserrat",
            data: montserratBold,
            style: "italic",
            weight: 900,
          },
        ],
      },
    );
  } catch (e) {
    return new Response("Failed to generate OG image", { status: 500 });
  }
};
