const firstSegmentRegex = /\/?([^\/]+)/;

export const getFirstSegment = (pathname: string) => {
  const result = firstSegmentRegex.exec(pathname);
  return result && result[1];
};

export const isNotUndefined = <T>(value: T | undefined): value is T => {
  return value !== undefined;
};

export class UnreachableCaseError extends Error {
  constructor(value: never) {
    super(`A value got through that shouldn't exist: ${JSON.stringify(value)}`);
  }
}
