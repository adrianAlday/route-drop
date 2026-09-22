import { NextRequest } from "next/server";
import { getRoute } from "@/app/page";
import { Route } from "@/app/_components/HomeMap";
import { darkBlue, lightGray, routeColors } from "@/app/_utils/colors";
import { ImageResponse } from "next/og";

const loadGoogleFont = async ({
  name,
  style,
  weight,
  text,
}: {
  name: string;
  style: string;
  weight: number;
  text: string;
}) => {
  const match = (
    await fetch(
      `https://fonts.googleapis.com/css2?family=${name}:${style === "italic" ? "ital,wght@1," : "wght@"}${weight}&text=${encodeURIComponent(text)}`,
    ).then((res) => res.text())
  ).match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);

  if (!match || !match[1]) {
    throw new Error("Font not found");
  }

  return fetch(match[1]).then((res) => res.arrayBuffer());
};

export const revalidate = 3600;

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

    const name = "Montserrat";
    const style = "italic";
    const weight = 900;
    const data = await loadGoogleFont({
      name,
      style,
      weight,
      text: [title, ...lines].join(`\n`),
    });

    return new ImageResponse(
      <div
        style={{
          background: darkBlue,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Montserrat",
          letterSpacing: "-0.04em",
          whiteSpace: "pre-wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 128, color: lightGray }}>{title}</div>

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
            name,
            style,
            weight,
            data,
          },
        ],
      },
    );
  } catch (error) {
    return new Response(`Failed to generate OG image: ${error}`, {
      status: 500,
    });
  }
};
