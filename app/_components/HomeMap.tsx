"use client";

import { useState, useEffect } from "react";
import Bouncer from "./Bouncer";

const HomeMap = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {}, []);

  return (
    <div className="w-dvw">
      <Bouncer classNames={loading ? "block" : "hidden"} />

      <div className={`${loading ? "hidden" : "block"} relative`}>asdf</div>
    </div>
  );
};

export default HomeMap;
