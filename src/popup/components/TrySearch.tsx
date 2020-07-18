import React from "react";

type Props = {
  hostname: string;
  username?: string;
};

const TrySearch: React.FC<Props> = ({ hostname, username }) => {
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
        <a href={searchUrl}>{searchUrl}</a>
      </div>
    </div>
  );
};

export default TrySearch;
