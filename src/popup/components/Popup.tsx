import React, { useState } from "react";

import * as cache from "../../resultCache";
import useEffectAsync from "../../hooks/useEffectAsync";
import { Result } from "../../resultCache";
import Success from "./Success";
import TrySearch from "./TrySearch";
import Private from "./Private";
import ErrorResult from "./Error";
import { UnreachableCaseError } from "../../utils";

const getTab = () =>
  new Promise<chrome.tabs.Tab | undefined>((resolve) =>
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      resolve(tab);
    })
  );

const Popup: React.FC = () => {
  // undefined = getting result from cache
  // null = cache did not contain a result
  const [result, setResult] = useState<Result | null | undefined>();

  useEffectAsync(async () => {
    const tab = await getTab();

    if (!tab) {
      console.error("no tab");
      setResult({ type: "error" });
      return;
    }

    if (!tab.url) {
      // This is probably a restricted page like chrome://extensions
      setResult({ type: "nope" });
      return;
    }

    const url = new URL(tab.url);

    setResult(await cache.get(url));
    return cache.listen(url, setResult);
  }, []);

  if (result === undefined || result === null) {
    return <>loading...</>;
  }

  switch (result.type) {
    case "success":
      return <Success url={result.url} />;

    case "try-search":
      return (
        <TrySearch hostname={result.hostname} username={result.username} />
      );

    case "not-public":
      return <Private url={result.url} />;

    case "nope":
      return <div>This is not a GitHub Pages site</div>;

    case "error":
      return <ErrorResult />;

    default:
      throw new UnreachableCaseError(result);
  }
};

export default Popup;
