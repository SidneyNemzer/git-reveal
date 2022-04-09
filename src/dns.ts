// https://developers.google.com/speed/public-dns/docs/secure-transports
const DNS_API_URL = "https://dns.google.com/resolve";
const CACHE_KEY_PREFIX = "cached-dns-";

const getCacheKey = (url: URL): string => {
  return `${CACHE_KEY_PREFIX}${url.toString()}`;
};

type Response = {
  Status: number;
  Answer: {
    data: string;
  }[];
};

export const dnsCnameLookup = async (url: URL): Promise<string[]> => {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return [];
  }

  const key = getCacheKey(url);
  const { [key]: cache } = await chrome.storage.session.get([key]);
  if (cache !== undefined) {
    return cache;
  }

  const res = await fetch(
    `${DNS_API_URL}?type=cname&name=${encodeURIComponent(url.hostname)}`
  );
  const data: Response = await res.json();

  if (!data || data.Status !== 0) {
    throw new Error(`DNS lookup failed, data: ${JSON.stringify(data)}`);
  }

  // This domain doesn't have a CNAME record
  if (!data.Answer) {
    return [];
  }

  const cnames = data.Answer.map(({ data }) => data);
  try {
    await chrome.storage.session.set({ [key]: cnames });
  } catch (error) {
    // The session storage is probably full. The cache data is very small, so
    // this should be super rare in practice.
    console.error("Failed to set github header cache:", error);
  }
  return cnames;
};

export const testOnly = { getCacheKey };
