import { hasGitHubHeader, testOnly } from "./has-github-header";

let returnMockHeader = false;

const mockFetch: jest.Mock = jest.fn(() =>
  Promise.resolve({
    headers: {
      get() {
        if (returnMockHeader) {
          return "github.com";
        }
        return null;
      },
    },
  })
);

const mockStorageSessionGet: jest.Mock = chrome.storage.session.get as any;
const mockStorageSessionSet: jest.Mock = chrome.storage.session.set as any;

global.fetch = mockFetch;

beforeEach(() => {
  returnMockHeader = false;
  mockFetch.mockClear();
  mockStorageSessionGet.mockClear();
  mockStorageSessionSet.mockClear();
});

test("non-http(s)", async () => {
  const result = await hasGitHubHeader(new URL("file://test"));
  expect(result).toBe(false);
  expect(mockFetch).not.toBeCalled();
});

test("no header, no cache", async () => {
  const url = new URL("https://noheader.com/");
  const result = await hasGitHubHeader(url);
  expect(result).toBe(false);
  expect(mockFetch).toBeCalledWith(url.toString(), {
    mode: "no-cors",
  });
  expect(mockStorageSessionGet).toBeCalledWith([testOnly.getCacheKey(url)]);
  expect(mockStorageSessionSet).toBeCalledWith({
    [testOnly.getCacheKey(url)]: false,
  });
});

test("has header, no cache", async () => {
  returnMockHeader = true;
  const result = await hasGitHubHeader(new URL("https://hasheader.com"));
  expect(result).toBe(true);
  expect(mockFetch).toBeCalledWith("https://hasheader.com/", {
    mode: "no-cors",
  });
});

test("no header, cached", async () => {
  const url = new URL("https://noheader.com/");
  mockStorageSessionGet.mockImplementationOnce(() =>
    Promise.resolve({ [testOnly.getCacheKey(url)]: false })
  );
  const result = await hasGitHubHeader(url);
  expect(result).toBe(false);
  expect(mockFetch).not.toBeCalled();
  expect(mockStorageSessionGet).toBeCalledWith([testOnly.getCacheKey(url)]);
  expect(mockStorageSessionSet).not.toBeCalled();
});

test("has header, cached", async () => {
  const url = new URL("https://hasheader.com/");
  mockStorageSessionGet.mockImplementationOnce(() =>
    Promise.resolve({ [testOnly.getCacheKey(url)]: true })
  );
  const result = await hasGitHubHeader(url);
  expect(result).toBe(true);
  expect(mockFetch).not.toBeCalled();
  expect(mockStorageSessionGet).toBeCalledWith([testOnly.getCacheKey(url)]);
  expect(mockStorageSessionSet).not.toBeCalled();
});
