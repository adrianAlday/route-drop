"use client";

import { useRef, useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { URLPattern } from "urlpattern-polyfill";
import { darkBlue } from "../_utils/colors";

const Builder = () => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

  useEffect(() => {
    const textArea = textAreaRef.current;

    if (textArea) {
      textArea.style.height = "auto";
      textArea.style.height = `${textArea.scrollHeight + 4}px`;
    }
  }, [inputValue]);

  const pattern = new URLPattern({ pathname: "/routes/:routeId" });

  const handleSubmit = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (inputValue) {
      redirect(
        "/?r=" +
          inputValue
            .split(/[\s,]+/)
            .map((string) => pattern.exec(string)?.pathname.groups.routeId)
            .join(","),
      );
    }
  };

  return (
    <div className="p-4">
      <textarea
        ref={textAreaRef}
        rows={1}
        placeholder={"Routes?"}
        value={inputValue}
        onChange={handleInputChange}
        enterKeyHint={"enter"}
        className={
          "border border-2 focus:border-[rgb(234,57,128)] rounded-md w-full p-3 resize-none transition-all duration-80 transition-discrete"
        }
        style={{ borderColor: darkBlue, color: darkBlue }}
      />

      <div
        className={`mt-3 rounded-md w-full bg-[rgb(234,57,128)] text-[rgb(255,255,255)] p-3 flex items-center justify-center ${inputValue ? "cursor-pointer opacity-100" : "opacity-33"} transition-all duration-80 transition-discrete`}
        onClick={handleSubmit}
      >
        <div>
          <svg
            viewBox="0 0 20.8498 27.0469"
            xmlns="http://www.w3.org/2000/svg"
            className="size-6"
          >
            <g>
              <rect height="27.0469" opacity="0" width="20.8498" x="0" y="0" />

              <path
                d="M12.8331 5.51367C14.3565 5.51367 15.5928 4.27734 15.5928 2.75391C15.5928 1.23047 14.3565 0 12.8331 0C11.3096 0 10.0792 1.23047 10.0792 2.75391C10.0792 4.27734 11.3096 5.51367 12.8331 5.51367ZM8.58503 16.1016L13.0733 18.627L10.2022 21.0938C9.54597 21.6445 9.49323 22.4355 9.95027 22.9453C10.419 23.4668 11.1983 23.5195 11.8897 22.9395L16.0675 19.377C16.6944 18.8379 16.5889 17.7129 15.8448 17.2266L11.3682 14.2969L12.2413 11.2383C12.3409 10.8809 12.7452 10.8281 12.962 11.1504L14.2979 13.1074C14.6378 13.5996 15.2764 13.7812 15.8272 13.5293L19.671 11.8184C20.4034 11.4844 20.6846 10.8223 20.3624 10.1484C20.0401 9.49805 19.3956 9.29297 18.6632 9.61523L15.7042 10.9219L13.6593 8.10352C12.5343 6.55078 11.1339 5.94141 8.89558 6.10547L4.63581 6.4043C3.91511 6.45703 3.40534 6.9375 3.29988 7.6875L2.72566 12C2.61433 12.8145 3.03034 13.3945 3.77448 13.4766C4.50691 13.541 4.98738 13.1133 5.0987 12.2988L5.60261 8.86523L7.2198 8.74805C7.54792 8.72461 7.82917 8.94141 7.7237 9.31641L6.73933 12.7793C6.12995 14.9238 7.5362 15.5098 8.58503 16.1016ZM0.458078 26.543C0.979563 26.9941 1.74128 26.9883 2.36823 26.3789L6.28816 22.4941C6.63972 22.1484 6.71589 22.0547 6.91511 21.5391L8.46784 17.5195L7.94636 17.2324C7.02058 16.7285 6.35261 16.207 5.89558 15.6562L4.52448 20.5137L0.469797 24.5449C-0.192312 25.1895-0.116141 26.0508 0.458078 26.543Z"
                fill="currentColor"
              />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Builder;
