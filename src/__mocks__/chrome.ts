const storage = {
  session: {
    set: jest.fn(() => Promise.resolve()),
    get: jest.fn((keys: string[]) => {
      const result: any = {};
      keys.forEach((key) => (result[key] = undefined));
      return Promise.resolve(result);
    }),
  },
};

export default { storage };
