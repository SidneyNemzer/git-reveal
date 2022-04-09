# 2.0

GIT REVEAL has been rewritten with a new strategy for checking websites. It requires fewer permissions and supports Chrome's Manifest V3. Instead of intercepting requests with `chrome.webRequest`, the new implementation sends a request for the page using `fetch` in the popup. This means the extension no longer requires `<all_urls>` permission.

Other changes in this update:

- Removed the extension's background page. The check is performed in the popup now.
- Service workers should no longer affect checking a website (#1, #5).
- Websites no longer need to be reloaded if the extension wasn't running when the page loaded.
- The extension icon is now static (blue), and no longer updates based on the check status.
- Fixed a false positive for github.io pages that 404 (#6).

# 1.0

Initial Release
