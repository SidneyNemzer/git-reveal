export const getFirstSegment = (pathname: string) => {
  const firstSlashIndex = pathname.indexOf("/");
  if (firstSlashIndex < 0) {
    return;
  }

  return pathname.slice(0, firstSlashIndex);
};

export const isNotUndefined = <T>(value: T | undefined): value is T => {
  return value !== undefined;
};

export class UnreachableCaseError extends Error {
  constructor(value: never) {
    super(`A value got through that shouldn't exist: ${JSON.stringify(value)}`);
  }
}
