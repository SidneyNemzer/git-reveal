const CACHE_KEY_PREFIX = "cached-has-server-github-header-";

const getCacheKey = (url: URL): string => {
  return `${CACHE_KEY_PREFIX}${url.toString()}`;
};

export const hasGitHubHeader = async (url: URL): Promise<boolean> => {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  const key = getCacheKey(url);
  const { [key]: cache } = await chrome.storage.session.get([key]);

  if (cache !== undefined) {
    return cache;
  }

  const res = await fetch(url.toString(), { mode: "no-cors" });
  const value = res.headers.get("Server");

  const result = !!value && value.toLowerCase() === "github.com";
  try {
    await chrome.storage.session.set({ [key]: result });
  } catch (error) {
    // The session storage is probably full. The cache data is very small, so
    // this should be super rare in practice.
    console.error("Failed to set github header cache:", error);
  }
  return result;
};

export const testOnly = { getCacheKey };
