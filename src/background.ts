import { onHeadersReceived, onTabUpdated, cleanup } from "./tabState";

cleanup();

chrome.tabs.onUpdated.addListener(onTabUpdated);

chrome.webRequest.onHeadersReceived.addListener(
  onHeadersReceived,
  {
    urls: ["https://*/*", "http://*/*"],
    types: ["main_frame"],
  },
  ["responseHeaders"]
);
