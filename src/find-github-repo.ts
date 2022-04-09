import { dnsCnameLookup } from "./dns";
import { hasGitHubHeader } from "./has-github-header";
import { getFirstSegment } from "./utils";

export type Result =
  | { type: "success"; url: string }
  | { type: "has-header"; hostname: string; username?: string }
  | { type: "private"; url: string }
  | { type: "nope" };

export const isPublicRepository = async (
  username: string,
  repository: string
): Promise<boolean> => {
  const res = await fetch(
    `https://api.github.com/repos/${username}/${repository}`,
    {
      method: "HEAD",
    }
  );
  if (res.status === 200) {
    return true;
  }

  if (res.status === 404) {
    return false;
  }

  if (res.status === 403) {
    throw new Error("GitHub Rate Limit Exceeded");
  }

  throw new Error(`Unexpected Status: ${res.status} ${res.statusText}`);
};

export const isPublicUrl = async (url: string): Promise<boolean> => {
  const res = await fetch(url);

  if (res.status === 200) {
    return true;
  }

  return false;
};

export const findGithubRepo = async (url: URL): Promise<Result> => {
  // Normalize hostname by removing optional trailing dot
  const hostname = url.hostname.replace(/\.$/, "");

  if (hostname === "github.io" || hostname.endsWith("github.com")) {
    return { type: "nope" };
  }

  if (hostname.endsWith("github.io")) {
    if (!(await isPublicUrl(url.toString()))) {
      return { type: "nope" };
    }

    const [username] = url.hostname.split(".");
    const repo = getFirstSegment(url.pathname) || `${username}.github.io`;
    const repoUrl = `https://github.com/${username}/${repo}`;

    if (await isPublicRepository(username, repo)) {
      return { type: "success", url: repoUrl };
    }

    return { type: "private", url: repoUrl };
  }

  if (!(await hasGitHubHeader(url))) {
    return { type: "nope" };
  }

  const cnames = await dnsCnameLookup(url);
  const githubPagesCname = cnames.find((cname) =>
    cname.endsWith(".github.io.")
  );

  if (!githubPagesCname) {
    // The Server: GitHub.com header indicates this is a GitHub Pages site, but
    // we don't know the username or repo.
    return { type: "has-header", hostname };
  }

  // Here, we get a domain like "sidneynemzer.github.io" so we know the user,
  // but not which repo.
  const [username] = githubPagesCname.split(".");

  return { type: "has-header", hostname, username };
};
