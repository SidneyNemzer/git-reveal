import { Result } from "../find-github-repo";

export type State =
  | { type: "loading" }
  | { type: "no-url" }
  | Result
  | { type: "error"; error?: Error };
