import { debug } from "./debug";
import * as cache from "./resultCache";
import checkSite from "./checkSite";
import { UnreachableCaseError } from "./utils";
import { Result } from "./resultCache";

export type TabState =
  | undefined
  | { type: "waiting-for-tab"; hasGithubHeader: boolean }
  | { type: "waiting-for-web-request" }
  | Result;

type InternalTabState =
  | undefined
  | { type: "waiting-for-tab"; hasGithubHeader: boolean }
  | { type: "waiting-for-web-request" }
  | { type: "done" };

type TabStates = { [id: number]: InternalTabState | undefined };

const tabs: TabStates = {};

export const onWebRequestCompleted = (
  details: chrome.webRequest.WebResponseCacheDetails
) => {
  if (!details.tabId) {
    debug("not a tab", details);
    return;
  }

  const hasGithubHeader = !!details.responseHeaders?.find(
    (header) =>
      header.name.toLowerCase() === "server" && header.value === "GitHub.com"
  );

  const state = tabs[details.tabId];
  if (state?.type === "waiting-for-web-request") {
    onTabLoaded(details.tabId, details.url, hasGithubHeader);
  } else {
    tabs[details.tabId] = { type: "waiting-for-tab", hasGithubHeader };
    debug("web request completed, waiting for tab", {
      tabId: details.tabId,
      headers: details.responseHeaders,
    });
    return;
  }
};

export const onTabUpdated = (
  tabId: number,
  changes: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab
) => {
  if (changes.status !== "complete") {
    return;
  }

  if (!tab.url) {
    // This is probably a restricted page like chrome://extensions
    debug("tab skipped because it doesn't have a URL", { tab });
    return;
  }

  const state = tabs[tabId];
  if (state?.type === "waiting-for-tab") {
    onTabLoaded(tabId, tab.url, state.hasGithubHeader);
  } else {
    tabs[tabId] = { type: "waiting-for-web-request" };
    debug("tab complete, waiting for web request", { tabId });
    return;
  }
};

const onTabLoaded = async (
  tabId: number,
  urlString: string,
  hasGithubHeader: boolean
) => {
  const url = new URL(urlString);
  try {
    const cachedResult = await cache.get(url);
    if (cachedResult) {
      debug("result is cached", {
        tabId,
        url,
        result: cachedResult,
      });
      showResult(tabId, cachedResult);
    } else {
      const result = await checkSite(url, !!hasGithubHeader);
      cache.set(url, result);
      showResult(tabId, result);
      debug("checked site", {
        tabId,
        url,
        result,
      });
    }
  } catch (error) {
    console.error("Error checking URL", { url }, error);
    cache.set(url, { type: "error" });
    showResult(tabId, { type: "error" });
  }
};

// TODO reset icon when navigating?
// Chrome resets it when the tab starts loading

const showResult = (tabId: number, result: Result) => {
  switch (result.type) {
    case "nope":
      break;

    case "success":
      chrome.browserAction.setIcon({ tabId, path: "icon-blue.png" });
      break;

    case "try-search":
      chrome.browserAction.setIcon({ tabId, path: "icon-orange.png" });
      break;

    case "not-public":
      chrome.browserAction.setIcon({ tabId, path: "icon-orange.png" });
      break;

    case "error":
      chrome.browserAction.setIcon({ tabId, path: "icon-red.png" });
      break;

    default:
      throw new UnreachableCaseError(result);
  }
};
