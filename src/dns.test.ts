import { dnsCnameLookup, testOnly } from "./dns";

let mockResponse: any = undefined;

const mockFetch: jest.Mock = jest.fn(() =>
  Promise.resolve({
    json() {
      return Promise.resolve(mockResponse);
    },
  })
);

const mockStorageSessionGet: jest.Mock = chrome.storage.session.get as any;
const mockStorageSessionSet: jest.Mock = chrome.storage.session.set as any;

global.fetch = mockFetch;

beforeEach(() => {
  mockResponse = undefined;
  mockFetch.mockClear();
  mockStorageSessionGet.mockClear();
  mockStorageSessionSet.mockClear();
});

test("non http(s)", async () => {
  const result = await dnsCnameLookup(new URL("file://test"));
  expect(result).toEqual([]);
  expect(mockFetch).not.toBeCalled();
});

test("no CNAME, no cache", async () => {
  const url = new URL("https://nocname.com/");
  mockResponse = { Status: 0, Answer: [] };
  const result = await dnsCnameLookup(url);
  expect(result).toEqual([]);
  expect(mockFetch).toHaveBeenCalledWith(
    "https://dns.google.com/resolve?type=cname&name=nocname.com"
  );
  expect(mockStorageSessionGet).toBeCalledWith([testOnly.getCacheKey(url)]);
  expect(mockStorageSessionSet).toBeCalledWith({
    [testOnly.getCacheKey(url)]: [],
  });
});

test("has CNAME, no cache", async () => {
  const url = new URL("https://hascname.com/");
  mockResponse = { Status: 0, Answer: [{ data: "github.github.io" }] };
  const result = await dnsCnameLookup(url);
  expect(result).toEqual(["github.github.io"]);
  expect(mockFetch).toHaveBeenCalledWith(
    "https://dns.google.com/resolve?type=cname&name=hascname.com"
  );
  expect(mockStorageSessionGet).toBeCalledWith([testOnly.getCacheKey(url)]);
  expect(mockStorageSessionSet).toBeCalledWith({
    [testOnly.getCacheKey(url)]: ["github.github.io"],
  });
});

test("no CNAME, cached", async () => {
  const url = new URL("https://nocname.com/");
  mockStorageSessionGet.mockImplementationOnce(() =>
    Promise.resolve({ [testOnly.getCacheKey(url)]: [] })
  );
  const result = await dnsCnameLookup(url);
  expect(result).toEqual([]);
  expect(mockFetch).not.toHaveBeenCalled();
  expect(mockStorageSessionGet).toBeCalledWith([testOnly.getCacheKey(url)]);
  expect(mockStorageSessionSet).not.toHaveBeenCalled();
});

test("has CNAME, cached", async () => {
  const url = new URL("https://hascname.com/");
  mockStorageSessionGet.mockImplementationOnce(() =>
    Promise.resolve({ [testOnly.getCacheKey(url)]: ["github.github.io"] })
  );
  const result = await dnsCnameLookup(url);
  expect(result).toEqual(["github.github.io"]);
  expect(mockFetch).not.toHaveBeenCalled();
  expect(mockStorageSessionGet).toBeCalledWith([testOnly.getCacheKey(url)]);
  expect(mockStorageSessionSet).not.toHaveBeenCalled();
});
