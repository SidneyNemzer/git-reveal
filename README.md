# GIT REVEAL

A Chrome extension to find the GitHub repository for a site hosted on GitHub pages

<!-- TODO: Install link -->

[**INSTALL**][install] | [**CHANGELOG**](CHANGELOG.md)

![](images/screenshot.png)

## How do I use it?

The extension icon turns BLUE when it detects a GitHub Pages site. Click on the icon to see the URL.

Here's a site you can use to try it out: https://twitter.github.io/

## How does it work?

Here's a high-level overview of the algorithm:

- The exact domain `github.io` and every domain under `github.com` are never a GitHub Pages site.
- The repo for `sidneynemzer.github.io/stuff` will be `github.com/sidneynemzer/stuff` or `github.com/sidneynemzer/sidneynemzer.github.io`.
- For other domains, if the document response has the header `Server: Github.com`, it is hosted by GitHub Pages.
  - Check for a CNAME DNS record, which is used for custom subdomains like `mysite.example.com`. The CNAME will point to a domain like `sidneynemzer.github.io`, which gives us the username. Apex domains like `example.com` don't use a CNAME, so we won't know the username for those domains.
  - The user is prompted to search GitHub for a CNAME file with the hostname. If the repo is public, it should be easy to find. The username can help narrow the search.

## Why does it need access to "all URLS"?

Because any domain could be a Github pages site.

---

Insipred by [pages2repo by Frozenfire92](https://github.com/Frozenfire92/Pages2Repo)

[install]: https://chrome.google.com/webstore/detail/git-reveal/momcopneegabfanhfajaoofjbjcdldek
