import { Suspense } from "react";
import Bouncer from "./Bouncer";
import { lightGray } from "../_utils/colors";

type LoadingWrapperProps = {
  children: React.ReactNode;
};

const LoadingWrapper = ({ children }: LoadingWrapperProps) => (
  <Suspense
    fallback={
      <div>
        <Bouncer />

        {
          // more data needed to display on mobile
        }
        <div style={{ color: lightGray }}>
          There{"'"}s a wise saying that goes like this: A real gentleman never
          discusses women he{"'"}s broken up with or how much tax he{"'"}s paid.
          Actually, this is a total lie. I just made it up. Sorry! But if there
          really were such a saying, I think that one more condition for being a
          gentleman would be keeping quiet about what you do to stay healthy. A
          gentleman shouldn{"'"}t go on and on about what he does to stay fit.
          At least that{"'"}s how I see it.
        </div>
      </div>
    }
  >
    {children}
  </Suspense>
);

export default LoadingWrapper;
