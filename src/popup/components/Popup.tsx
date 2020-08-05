import React, { useState } from "react";

import { listen, getTabState, TabState } from "../../tabState";
import useEffectAsync from "../../hooks/useEffectAsync";
import ResultView from "./ResultView";

const getTab = () =>
  new Promise<chrome.tabs.Tab | undefined>((resolve) =>
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      resolve(tab);
    })
  );

const Popup: React.FC = () => {
  const [result, setResult] = useState<Result | null | undefined>();

  useEffectAsync(async () => {
    const tab = await getTab();

    if (!tab || !tab.id) {
      console.error(`no tab${tab && !tab.id ? " id" : ""}`);
      setResult({ type: "error" });
      return;
    }

    setResult(await getTabState(tab.id));
    return listen(tab.id, setResult);
  }, []);

  return <ResultView state={result} />;
};

export default Popup;
