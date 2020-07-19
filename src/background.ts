import { onWebRequestCompleted, onTabUpdated } from "./tabState";

// TODO another page to show on installation, which asks user to refresh tabs

chrome.tabs.onUpdated.addListener(onTabUpdated);

chrome.webRequest.onCompleted.addListener(
  onWebRequestCompleted,
  {
    urls: ["https://*/*", "http://*/*"],
    types: ["main_frame"],
  },
  ["responseHeaders"]
);
