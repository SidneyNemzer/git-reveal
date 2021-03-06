import React from "react";
import { UnreachableCaseError } from "../../utils";
import { TabState } from "../../tabState";

const ISSUES_URL = "https://github.com/sidneynemzer/git-reveal/issues/new";

const ResultView: React.FC<{ state: TabState }> = ({ state }) => {
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
    case "waiting-for-tab":
      return <>loading...</>;

    case "success":
      return <Success url={state.url} />;

    case "service-worker":
      return <ServiceWorker hostname={state.hostname} />;

    case "try-search":
      return <TrySearch hostname={state.hostname} username={state.username} />;

    case "not-public":
      return <Private urls={state.urls} />;

    case "nope":
      return <div>This is not a GitHub Pages site</div>;

    case "error":
      return <ErrorResult />;

    default:
      throw new UnreachableCaseError(state);
  }
};

export default ResultView;

const ServiceWorker: React.FC<{
  hostname: string;
}> = ({ hostname }) => {
  const search = `${hostname} filename:CNAME`;
  const searchUrl = `https://github.com/search?q=${encodeURIComponent(
    search
  )}&type=code`;

  return (
    <div>
      <h1>Can't check this site</h1>
      <div>
        This site seems to be using a service worker which interferes with
        checking for a GitHub pages site. If you think this is a GitHub Pages
        site, you can try searching GitHub for this domain:
      </div>
      <div>
        <NewTabLink url={searchUrl} />
      </div>
    </div>
  );
};

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
        not be determined. Check the results of this search:
      </div>
      <div>
        <NewTabLink url={searchUrl} />
      </div>
    </div>
  );
};

const ErrorResult: React.FC = () => {
  return (
    <div>
      <h1>Something went wrong</h1>
      <div>
        An error occured while checking this site :(
        <br />
        <br />
        Please report this bug!
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
  urls: string[];
}> = ({ urls }) => {
  return (
    <div>
      <h1>Private Repository</h1>
      <div>
        This is probably a GitHub Pages site, but it looks like the repository
        is private.{" "}
        {urls.length === 1
          ? "I think this is the URL:"
          : "I think one of these is the URL:"}
      </div>
      {urls.map((url) => (
        <div>
          <NewTabLink url={url} />
        </div>
      ))}
    </div>
  );
};

const NewTabLink: React.FC<{ url: string }> = ({ url }) => (
  <a href={url} target="_blank">
    {url}
  </a>
);
