import React from "react";
import { UnreachableCaseError } from "../utils";
import { State } from "./state";

const ISSUES_URL = "https://github.com/sidneynemzer/git-reveal/issues/new";

const ResultView: React.FC<{ state: State }> = ({ state }) => {
  if (state === undefined) {
    return (
      <>
        <h1>Refresh the page to check this site</h1>
        <div>
          You probably installed or restarted the extension. GIT REVEAL needs to
          be running while the page loads to check if it's a GitHub Pages site.
        </div>
      </>
    );
  }

  switch (state.type) {
    case "loading":
      return <>loading...</>;

    case "no-url":
      return <div>This site doesn't have a URL so it can't be checked.</div>;

    case "success":
      return <Success url={state.url} />;

    case "has-header":
      return <TrySearch hostname={state.hostname} username={state.username} />;

    case "private":
      return <Private url={state.url} />;

    case "nope":
      return <div>This is not a GitHub Pages site</div>;

    case "error":
      return <ErrorResult error={state.error} />;

    default:
      throw new UnreachableCaseError(state);
  }
};

export default ResultView;

const TrySearch: React.FC<{
  hostname: string;
  username?: string;
}> = ({ hostname, username }) => {
  const usernameSearch = username && `users:${username}`;
  const search = [hostname, "filename:CNAME", usernameSearch]
    .filter(Boolean)
    .join(" ");
  const searchUrl = `https://github.com/search?q=${encodeURIComponent(
    search
  )}&type=code`;

  return (
    <div>
      <h1>GitHub Pages Detected</h1>
      <div>
        This is probably a GitHub Pages site, however the exact repository could
        not be determined. Try searching for the domain on GitHub:
      </div>
      <div>
        <NewTabLink url={searchUrl} />
      </div>
    </div>
  );
};

const ErrorResult: React.FC<{ error?: Error }> = ({ error }) => {
  return (
    <div>
      <h1>Something went wrong</h1>
      <div>
        An error occured while checking this site :(
        <br />
        {error ? (
          <pre>
            <code>{error.stack}</code>
          </pre>
        ) : (
          <code>(No error details captured)</code>
        )}
        Please report this bug here:
      </div>
      <div>
        <NewTabLink url={ISSUES_URL} />
      </div>
    </div>
  );
};

const Success: React.FC<{
  url: string;
}> = ({ url }) => (
  <div>
    <h1>This is a GitHub pages site</h1>
    <div>Here's the repository URL:</div>
    <div>
      <NewTabLink url={url} />
    </div>
  </div>
);

const Private: React.FC<{
  url: string;
}> = ({ url }) => {
  return (
    <div>
      <h1>Private Repository</h1>
      <div>
        This is probably a GitHub Pages site, but it looks like the repository
        is private. I think this is the URL:
      </div>
      <div>
        <NewTabLink url={url} />
      </div>
    </div>
  );
};

const NewTabLink: React.FC<{ url: string }> = ({ url }) => (
  <a href={url} target="_blank">
    {url}
  </a>
);
