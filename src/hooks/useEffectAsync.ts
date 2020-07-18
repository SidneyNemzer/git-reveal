import { useEffect } from "react";

const useEffectAsync = (
  callback: () => Promise<(() => void) | undefined>,
  deps: unknown[]
) => {
  useEffect(() => {
    let cleanup = () => {};

    callback()
      .then((value) => {
        if (typeof value === "function") {
          cleanup = value;
        } else if (value !== undefined) {
          console.warn("unexpected return value from `useEffectAsync`", value);
        }
      })
      .catch((error) => {
        console.error("`useEffectAsync` callback rejected", error);
      });

    return () => {
      cleanup();
    };
  }, deps);
};

export default useEffectAsync;
