// URL of DNS over HTTP (DoH) API, see

import { getFirstSegment } from "./utils";
import { Result } from "./resultCache";

// https://developers.google.com/speed/public-dns/docs/secure-transports
const DNS_API_URL = "https://dns.google.com/resolve";

const checkSite = async (
  url: URL,
  hasGithubServerHeader: boolean
): Promise<Result> => {
  if (
    url.hostname.endsWith("github.com") ||
    url.hostname.endsWith("github.com.")
  ) {
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

export default checkSite;
