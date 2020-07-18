import { debug } from "./debug";
import * as cache from "./resultCache";
import checkSite from "./checkSite";

export type TabState =
  | undefined
  | { type: "waiting-for-tab"; hasGithubHeader: boolean }
  | { type: "waiting-for-web-request" }
  | { type: "success"; url: string }
  | { type: "try-search"; hostname: string; username?: string }
  | { type: "not-public"; url: string }
  | { type: "nope" }
  | { type: "error" };

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

// TODO reset icon when navigating

const showResult = (tabId: number, result: TabState) => {
  if (!result) {
    // TODO a different type should probably be used to avoid this case
    return;
  }

  // TODO set title
  switch (result.type) {
    case "nope":
      break;

    case "success":
      chrome.browserAction.setIcon({ tabId, path: "icon-blue.png" });
      // chrome.browserAction.setPopup({
      //   tabId,
      //   popup: getResultPath({
      //     message: "This is a GitHub Pages site",
      //     description: "Here's the repository URL:",
      //     url: result.url,
      //   }),
      // });
      break;

    case "try-search":
      // const user = result.username && `user:${result.username}`;
      // const search = [result.hostname, "filename:CNAME", user]
      //   .filter(Boolean)
      //   .join(" ");

      // const popup = {
      //   tabId,
      //   // popup: "result.html?message=test",
      //   popup: getResultPath({
      //     message: "GitHub Pages Detected",
      //     description:
      //       "This is probably a GitHub Pages site, however the exact repository could not be determined. Check the results of this search:",
      //     url: `https://github.com/search?q=${encodeURIComponent(
      //       search
      //     )}&type=code`,
      //   }),
      // };
      chrome.browserAction.setIcon({ tabId, path: "icon-orange.png" });
      // chrome.browserAction.setPopup(popup);
      break;

    case "not-public":
      chrome.browserAction.setIcon({ tabId, path: "icon-orange.png" });
      // chrome.browserAction.setPopup({
      //   tabId,
      //   popup: getResultPath({
      //     message: "Private repository",
      //     description:
      //       "This is probably a GitHub Pages site, but it looks like the repository is private. Here's the URL I think it is:",
      //     url: result.url,
      //   }),
      // });
      break;

    case "error":
      chrome.browserAction.setIcon({ tabId, path: "icon-red.png" });
      // chrome.browserAction.setPopup({
      //   tabId,
      //   popup: getResultPath({
      //     message: "Something went wrong",
      //     description:
      //       "An error occured while checking this site :(\n\nPlease report this bug!",
      //     url: "https://github.com/sidneynemzer/pages2repo/issues/new",
      //   }),
      // });
      break;

    default:
      break;
  }
};

// const getResultPath = ({
//   message,
//   description,
//   url,
// }: {
//   message: string;
//   description: string;
//   url?: string;
// }) =>
//   `result.html?message=${encodeURIComponent(
//     message
//   )}&description=${encodeURIComponent(description)}${
//     url ? `&url=${encodeURIComponent(url)}` : ""
//   }`;
