type BouncerProps = {
  classNames?: string;
};

const Bouncer = ({ classNames }: BouncerProps) => (
  <div
    className={`mt-9 sm:mt-7 flex justify-center animate-pulse ${classNames}`}
  >
    <div className="flex space-x-2">
      <div className="rounded-full h-2 w-2 border border-1 border-[rgb(1,8,43)] bg-[rgb(234,57,128))] animate-bounce [animation-delay:-0.3s]" />

      <div className="rounded-full h-2 w-2 border border-1 border-[rgb(1,8,43)] bg-[rgb(217,252,82)] animate-bounce [animation-delay:-0.15s]" />

      <div className="rounded-full h-2 w-2 border border-1 border-[rgb(1,8,43)] bg-[rgb(57,128,234))] animate-bounce" />
    </div>
  </div>
);

export default Bouncer;
