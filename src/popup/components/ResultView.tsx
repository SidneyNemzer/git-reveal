import React from "react";
import { Result } from "../../resultCache";
import { UnreachableCaseError } from "../../utils";

const ISSUES_URL = "https://github.com/sidneynemzer/pages2repo/issues/new";

const ResultView: React.FC<{ result: Result }> = ({ result }) => {
  switch (result.type) {
    case "success":
      return <Success url={result.url} />;

    case "try-search":
      return (
        <TrySearch hostname={result.hostname} username={result.username} />
      );

    case "not-public":
      return <Private url={result.url} />;

    case "nope":
      return <div>This is not a GitHub Pages site</div>;

    case "error":
      return <ErrorResult />;

    default:
      throw new UnreachableCaseError(result);
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
