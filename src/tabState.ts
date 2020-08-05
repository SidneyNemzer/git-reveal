import { debug } from "./debug";
import * as cache from "./resultCache";
import checkSite from "./checkSite";
import { UnreachableCaseError } from "./utils";
import { Result } from "./resultCache";

export type TabState =
  | undefined // idle
  | { type: "waiting-for-tab"; hasGithubHeader: boolean }
  | Result;

type InternalTabState =
  | undefined // idle
  | { type: "waiting-for-tab"; hasGithubHeader: boolean }
  | { type: "cached"; key: string };

const TAB_STATE_KEY_PREFIX = "tab-state-";

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

  setTabState(details.tabId, details.url, {
    type: "waiting-for-tab",
    hasGithubHeader,
  });
  debug("web request completed, waiting for tab", {
    tabId: details.tabId,
    headers: details.responseHeaders,
  });
};

export const onTabUpdated = async (
  tabId: number,
  changes: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab
) => {
  if (changes.status !== "complete") {
    return;
  }

  if (!tab.url) {
    // This is probably a restricted page like chrome://extensions
    // Definitely not a GitHub Pages site.
    setTabState(tabId, "about:blank", { type: "nope" });
    return;
  }

  const state = await getTabState(tabId);
  if (state?.type === "waiting-for-tab") {
    onTabLoaded(tabId, tab.url, state.hasGithubHeader);
  } else {
    // Tab completed but a request didn't complete yet. This happens if the
    // site is using a service worker. The web request will never fire,
    // so we can never check for the GitHub header.
    setTabState(tabId, tab.url, {
      type: "service-worker",
      hostname: new URL(tab.url).hostname,
    });
  }
};

const onTabLoaded = async (
  tabId: number,
  urlString: string,
  hasGithubHeader: boolean
) => {
  const url = new URL(urlString);
  try {
    const { key: cacheKey, result: cachedResult } = await cache.getByUrl(url);
    if (cachedResult) {
      // The result is cached, so we need to update the tab state to point to the cache
      const key = TAB_STATE_KEY_PREFIX + tabId;
      chrome.storage.local.set({ [key]: { type: "cached", key: cacheKey } });
      showResult(tabId, cachedResult);
      debug("result is cached", {
        tabId,
        url,
        result: cachedResult,
      });
    } else {
      const result = await checkSite(url, !!hasGithubHeader);
      showResult(tabId, result);
      setTabState(tabId, urlString, result);
      debug("checked site", {
        tabId,
        url,
        result,
      });
    }
  } catch (error) {
    console.error("Error checking URL", { url }, error);
    const result = { type: "error" } as const;
    showResult(tabId, result);
    setTabState(tabId, urlString, result);
  }
};

const setTabState = (tabId: number, url: string, state: TabState) => {
  if (!state) {
    return;
  }

  const key = TAB_STATE_KEY_PREFIX + tabId;

  switch (state.type) {
    case "waiting-for-tab":
      chrome.storage.local.set({ [key]: state });
      break;

    case "success":
    case "service-worker":
    case "try-search":
    case "not-public":
    case "nope":
    case "error":
      const cacheKey = cache.set(new URL(url), state);
      chrome.storage.local.set({ [key]: { type: "cached", key: cacheKey } });
      break;

    default:
      throw new UnreachableCaseError(state);
  }
};

export const getTabState = (tabId: number) => {
  const key = TAB_STATE_KEY_PREFIX + tabId;
  return new Promise<TabState>((resolve) => {
    chrome.storage.local.get(key, async (value) => {
      const result: InternalTabState = value[key];
      if (!result || result.type === "waiting-for-tab") {
        resolve(result);
        return;
      } else if (result.type === "cached") {
        const cachedResult = await cache.getByKey(result.key);
        if (!cachedResult) {
          resolve(undefined);
          return;
        }
        resolve(cachedResult);
        return;
      }

      throw new UnreachableCaseError(result);
    });
  });
};

const showResult = (tabId: number, result: Result) => {
  switch (result.type) {
    case "nope":
    case "service-worker":
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

export const listen = (tabId: number, onChange: (state: TabState) => void) => {
  const handleChange = async (
    // chrome.storage.StorageChange is incorrect, it says the shape is
    //
    //   { newValue: ..., oldValue: ... }
    //
    // the shape is actually
    //
    //   { [key]: { newValue: ..., oldValue: ... } }
    //
    changes: any,
    area: string
  ) => {
    if (area !== "local") {
      return;
    }

    const key = TAB_STATE_KEY_PREFIX + tabId;

    const value: InternalTabState = changes[key]?.newValue;
    if (!value) {
      return;
    }

    switch (value.type) {
      case "waiting-for-tab":
        onChange(value);
        break;

      case "cached":
        onChange(await cache.getByKey(value.key));
    }
  };

  chrome.storage.onChanged.addListener(handleChange);

  return () => {
    chrome.storage.onChanged.removeListener(handleChange);
  };
};

/**
 * Removes all tab state from local storage.
 *
 * Doesn't touch cached results.
 */
export const cleanup = () => {
  chrome.storage.local.get((storage: { [key: string]: unknown }) => {
    const keysToDelete = Object.keys(storage).filter((key) =>
      // There could be other data in storage, skip keys that aren't tab state
      key.startsWith(TAB_STATE_KEY_PREFIX)
    );

    chrome.storage.local.remove(keysToDelete);
  });
};
