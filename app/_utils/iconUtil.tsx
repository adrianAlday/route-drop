import { ImageResponse } from "next/og";

type IconUtilProps = {
  side: number;
  scale: number;
};

export const IconUtil =
  ({ side, scale }: IconUtilProps) =>
  async () =>
    new ImageResponse(
      <div
        style={{
          color: "white",
          fontSize: (1 / 1) * side * scale,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        🐺
      </div>,
      {
        height: side,
        width: side,
      },
    );
