import { getFirstSegment } from "./utils";

type CachedResult = Result & { createdAt: string; _type: "CachedResult" };

const CACHE_TIME_MS = 60 * 60 * 1000; // one hour
const CACHE_KEY_PREFIX = "result-";

export type Result =
  | { type: "success"; url: string }
  | { type: "service-worker"; hostname: string }
  | {
      type: "try-search";
      hostname: string;
      username?: string;
    }
  | { type: "not-public"; urls: string[] }
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
  const key = getCacheKey(url);
  chrome.storage.local.set({
    [key]: {
      createdAt: new Date().toString(),
      ...result,
    },
  });

  cleanup();

  return key;
};

const isFresh = (result: CachedResult) =>
  new Date().getTime() - new Date(result.createdAt).getTime() < CACHE_TIME_MS;

export const getByUrl = async (url: URL) => {
  const key = getCacheKey(url);
  const result = await getByKey(key);
  return { key, result };
};

export const getByKey = (key: string) => {
  return new Promise<Result | undefined>((resolve) => {
    chrome.storage.local.get(key, (value) => {
      const result: CachedResult | undefined = value[key];
      if (result && isFresh(result)) {
        return resolve(result);
      } else {
        resolve(undefined);
      }
    });
  });
};

/**
 * Removes expired results from the cache
 */
export const cleanup = () => {
  // Technically there might be other stuff in storage but we check the key
  // below, so we can be just assume the value type here.
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
