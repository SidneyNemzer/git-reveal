import React, { useState } from "react";
import ReactDom from "react-dom";
import ResultView from "./ResultView";
import useEffectAsync from "../hooks/useEffectAsync";
import { findGithubRepo } from "../find-github-repo";
import { State } from "./state";

const Popup: React.FC = () => {
  const [state, setState] = useState<State>({ type: "loading" });

  useEffectAsync(async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || !tab.url) {
      setState({ type: "no-url" });
      return;
    }

    try {
      setState(await findGithubRepo(new URL(tab.url)));
    } catch (error) {
      console.error(error);
      setState({ type: "error", error: error as any });
    }
  }, []);

  return <ResultView state={state} />;
};

const root = document.querySelector("#root");
if (!root) {
  throw new Error("missing root");
}

ReactDom.render(<Popup />, root);
