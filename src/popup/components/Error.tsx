import React from "react";

const ISSUES_URL = "https://github.com/sidneynemzer/pages2repo/issues/new";

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
        <a href={ISSUES_URL}>{ISSUES_URL}</a>
      </div>
    </div>
  );
};

export default ErrorResult;
