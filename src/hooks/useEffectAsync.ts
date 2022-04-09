import { useEffect } from "react";

const useEffectAsync = (
  callback: () => Promise<(() => void) | void>,
  deps: unknown[]
) => {
  useEffect(() => {
    let mounted = true;
    let cleanup = () => {};

    callback()
      .then((value) => {
        if (typeof value === "function") {
          if (!mounted) {
            cleanup();
            return;
          }
          cleanup = value;
        } else if (value !== undefined) {
          console.warn("unexpected return value from `useEffectAsync`", value);
        }
      })
      .catch((error) => {
        console.error("`useEffectAsync` callback rejected", error);
      });

    return () => {
      mounted = false;
      cleanup();
    };
  }, deps);
};

export default useEffectAsync;
