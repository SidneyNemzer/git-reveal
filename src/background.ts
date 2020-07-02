interface Window {
  DEBUG: boolean;
}

window.DEBUG = true;

// URL of DNS over HTTP (DoH) API, see
// https://developers.google.com/speed/public-dns/docs/secure-transports
const DNS_API_URL = "https://dns.google.com/resolve";

// TODO cache results
// TODO another page to show on installation, which asks user to refresh tabs

type Result =
  | { type: "success"; url: string }
  | { type: "try-search"; hostname: string; username?: string }
  | { type: "not-public"; url: string }
  | { type: "nope" }
  | { type: "error" };

const checkSite = async (
  url: URL,
  hasGithubServerHeader: boolean
): Promise<Result> => {
  if (url.hostname === "github.com") {
    // URLs on github.com will never host a github pages site.
    return { type: "nope" };
  }

  if (
    url.hostname.endsWith("github.io") ||
    url.hostname.endsWith("github.io.")
  ) {
    const domainParts = url.hostname.split(".").filter(Boolean);
    if (domainParts.length <= 2) {
      // Currently, the bare domain github.io redirects to
      // pages.github.com. That should mean we never see the domain
      // 'github.io', but we'll explicitly ignore it here just in case.
      return { type: "nope" };
    }

    // For sites like "sidneynemzer.github.io/*", we can figure out the repo pretty easily

    const repoUrl = `https://github.com/${domainParts[0]}/${getFirstSegment(
      url.pathname
    )}`;
    const res = await fetch(repoUrl);
    return {
      type: res.status === 200 ? "success" : "not-public",
      url: repoUrl,
    };
  } else if (hasGithubServerHeader) {
    // Pages with this header are probably a Github pages site, we can check
    // the DNS records to find the Github pages domain.
    const dnsRes = await fetch(
      `${DNS_API_URL}?type=cname&name=${url.hostname}`
    );
    const data = await dnsRes.json();
    if (!data || data.Status !== 0) {
      console.error("DNS lookup: unexpected data or status code", data);
      return { type: "error" };
    }

    if (!data.Answer) {
      // This is probably a github pages site, but it does not use a CNAME record
      return { type: "try-search", hostname: url.hostname };
    }

    // Note: query is restricted to CNAME by the `type` parameter, so
    // we only get back CNAME records.
    const githubPagesDomainAnswer = data.Answer.find(
      (answer: { data: string }) => answer.data.endsWith("github.io.")
    );

    if (!githubPagesDomainAnswer) {
      // This is probably a github pages site, but it does not use a CNAME record
      return { type: "try-search", hostname: url.hostname };
    }

    // Here, we get a domain like "sidneynemzer.github.io" so we know the user, but
    // not which repo.
    const [username] = githubPagesDomainAnswer.data.split(".");
    const repoUrl = `https://github.com/${username}/${username}.github.io`;
    const res = await fetch(repoUrl);
    if (res.status === 200) {
      return { type: "success", url: repoUrl };
    } else {
      // We still don't know the repo, tell the user to search for it
      return {
        type: "try-search",
        hostname: url.hostname,
        username,
      };
    }
  }

  // Doesn't look like a github pages site
  return { type: "nope" };
};

// chrome.webRequest.onBeforeRequest.addListener(
//   (details) => {
//     console.log("onbeforerequest");
//     // chrome.browserAction.show(details.tabId, () => {
//     //   console.log("showed pageaction");
//     // });
//   },
//   {
//     urls: ["<all_urls>"],
//     types: ["main_frame"],
//   }
// );

chrome.webRequest.onCompleted.addListener(
  async (details) => {
    if (details.tabId === -1) {
      debug("not a tab", details);
      return;
    }

    const url = new URL(details.url);

    const hasGithubServerHeader = details.responseHeaders?.find(
      (header) =>
        header.name.toLowerCase() === "server" && header.value === "GitHub.com"
    );

    try {
      const result = await checkSite(url, !!hasGithubServerHeader);
      showResult(details.tabId, result);
      debug("checked site", { url, headers: details.responseHeaders, result });
    } catch (error) {
      console.error("Error checking URL", { url }, error);
      showResult(details.tabId, { type: "error" });
    }
  },
  {
    urls: ["https://*/*", "http://*/*"],
    types: ["main_frame"],
  },
  ["responseHeaders"]
);

// TODO reset icon when navigating

const showResult = (tabId: number, result: Result) => {
  // TODO set title
  switch (result.type) {
    case "nope":
      console.log("setPopup");
      chrome.browserAction.setPopup({ tabId, popup: "not-a-pages-site.html" });
      // chrome.browserAction.show(tabId, () => {
      //   console.log("showed pageaction after setPopup");
      // });
      break;
    case "success":
      chrome.browserAction.setIcon({ tabId, path: "icon-blue.png" });
      chrome.browserAction.setPopup({
        tabId,
        popup: getResultPath({
          message: "This is a GitHub Pages site",
          description: "Here's the repository URL:",
          url: result.url,
        }),
      });
      break;
    case "try-search":
      const user = result.username && `user:${result.username}`;
      const search = [result.hostname, "filename:CNAME", user]
        .filter(Boolean)
        .join(" ");

      chrome.browserAction.setIcon({ tabId, path: "icon-orange.png" });
      chrome.browserAction.setPopup({
        tabId,
        popup: getResultPath({
          message: "Could not determine repository",
          description:
            "This is probably a GitHub Pages site, however the exact repository could not be determined. Try searching for the hostname on GitHub.",
          url: `https://github.com/search?q=${encodeURIComponent(
            search
          )}&type=code`,
        }),
      });
      break;
    case "not-public":
      chrome.browserAction.setIcon({ tabId, path: "icon-orange.png" });
      chrome.browserAction.setPopup({
        tabId,
        popup: getResultPath({
          message: "Private repository",
          description:
            "This is probably a GitHub Pages site, but it looks like the repository is private. Here's the URL I think it is:",
          url: result.url,
        }),
      });
      break;
    case "error":
      chrome.browserAction.setIcon({ tabId, path: "icon-red.png" });
      chrome.browserAction.setPopup({
        tabId,
        popup: getResultPath({
          message: "Something went wrong",
          description:
            "An error occured while checking this site :(\n\nPlease report this bug!",
          url: "https://github.com/sidneynemzer/pages2repo/issues/new",
        }),
      });
      break;
    default:
      break;
  }
};

const getResultPath = ({
  message,
  description,
  url,
}: {
  message: string;
  description: string;
  url?: string;
}) =>
  `result.html?message=${encodeURIComponent(
    message
  )}&description=${encodeURIComponent(description)}${
    url ? `&url=${encodeURIComponent(url)}` : ""
  }`;

const getFirstSegment = (pathname: string) => {
  const firstSlashIndex = pathname.indexOf("/");
  if (firstSlashIndex < 0) {
    return;
  }

  return pathname.slice(0, firstSlashIndex);
};

const debug = (...args: unknown[]) => {
  if (window.DEBUG) {
    console.debug(...args);
  }
};
