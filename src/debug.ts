window.DEBUG = true;

export const debug = (...args: unknown[]) => {
  if (window.DEBUG) {
    console.debug(...args);
  }
};
