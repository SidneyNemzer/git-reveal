import { getFirstSegment } from "./utils";

type CachedResult = Result & { createdAt: string; _type: "CachedResult" };

const CACHE_TIME_MS = 60 * 60 * 1000; // one hour
const CACHE_KEY_PREFIX = "result-";

export type Result =
  | { type: "success"; url: string }
  | { type: "try-search"; hostname: string; username?: string }
  | { type: "not-public"; url: string }
  | { type: "nope" }
  | { type: "error" };

const getCacheKey = (url: URL) => {
  const isGithubIo =
    url.hostname.endsWith("github.io") || url.hostname.endsWith("github.io.");
  const urlPart = isGithubIo
    ? `${url.hostname}/${getFirstSegment(url.pathname)}`
    : url.hostname;
  return `${CACHE_KEY_PREFIX}${urlPart}`;
};

export const set = (url: URL, result: Result) => {
  chrome.storage.local.set({
    [getCacheKey(url)]: {
      createdAt: new Date().toString(),
      ...result,
    },
  });
  cleanup();
};

const isFresh = (result: CachedResult) =>
  new Date().getTime() - new Date(result.createdAt).getTime() < CACHE_TIME_MS;

export const get = (url: URL) => {
  const key = getCacheKey(url);
  return new Promise<Result | null>((resolve) => {
    chrome.storage.local.get(key, (value) => {
      const result: CachedResult | undefined = value[key];
      if (result && isFresh(result)) {
        return resolve(result);
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * Removes expired results from the cache
 */
export const cleanup = () => {
  chrome.storage.local.get((storage: { [key: string]: CachedResult }) => {
    const keysToDelete = Object.entries(storage)
      .filter(([key, result]) => {
        // There could be other data in storage, skip keys that aren't results
        if (!key.startsWith(CACHE_KEY_PREFIX)) {
          return false;
        }

        return !isFresh(result);
      })
      .map(([key]) => key);

    chrome.storage.local.remove(keysToDelete);
  });
};

export const listen = (url: URL, onChange: (state: CachedResult) => void) => {
  const handleChange = (
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

    const value = changes[getCacheKey(url)]?.newValue;
    if (value) {
      onChange(value);
    }
  };

  chrome.storage.onChanged.addListener(handleChange);

  return () => {
    chrome.storage.onChanged.removeListener(handleChange);
  };
};
