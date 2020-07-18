import React from "react";

type Props = {
  url: string;
};

const Private: React.FC<Props> = ({ url }) => {
  return (
    <div>
      <h1>Private Repository</h1>
      <div>
        This is probably a GitHub Pages site, but it looks like the repository
        is private. I think this is the URL:
      </div>
      <div>
        <a href={url}>{url}</a>
      </div>
    </div>
  );
};

export default Private;
