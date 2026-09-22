const Dot = ({
  animationDelay = "0s",
  backgroundColor = "rgb(234,57,128)",
}) => (
  <div
    className="rounded-full h-2 w-2 border border-1 border-[rgb(1,8,43)] animate-bounce"
    style={{ animationDelay, backgroundColor }}
  />
);

type BouncerProps = {
  classNames?: string;
};

const Bouncer = ({ classNames }: BouncerProps) => (
  <div
    className={`mt-9 sm:mt-7 flex justify-center animate-pulse ${classNames}`}
  >
    <div className="flex space-x-2">
      <Dot animationDelay={"-0.30s"} backgroundColor={"rgb(234,57,128)"} />

      <Dot animationDelay={"-0.15s"} backgroundColor={"rgb(217,252,82)"} />

      <Dot animationDelay={"-0.00s"} backgroundColor={"rgb(57,128,234)"} />
    </div>
  </div>
);

export default Bouncer;
