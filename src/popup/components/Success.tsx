import React from "react";

type Props = {
  url: string;
};

const Success: React.FC<Props> = ({ url }) => (
  <div>
    <h1>This is a GitHub pages site</h1>
    <div>Here's the repository URL:</div>
    <div>
      <a href={url}>{url}</a>
    </div>
  </div>
);

export default Success;
