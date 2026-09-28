import { routeColors, darkBlue } from "../_utils/colors";

const Dot = ({ animationDelay = "0s", backgroundColor = routeColors[0] }) => (
  <div
    className="rounded-full h-2 w-2 border border-1 animate-bounce"
    style={{ animationDelay, backgroundColor, borderColor: darkBlue }}
  />
);

type BouncerProps = {
  classNames?: string;
};

const Bouncer = ({ classNames }: BouncerProps) => (
  <div className={`mt-9 flex justify-center ${classNames}`}>
    <div className="flex space-x-2">
      <Dot animationDelay={"-0.30s"} backgroundColor={routeColors[0]} />

      <Dot animationDelay={"-0.15s"} backgroundColor={routeColors[1]} />

      <Dot animationDelay={"-0.00s"} backgroundColor={routeColors[2]} />
    </div>
  </div>
);

export default Bouncer;
