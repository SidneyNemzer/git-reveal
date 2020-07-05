# pages2repo

If you visit a site that is hosted on GitHub pages, this extension can probably figure out the repository URL.

## How does it work?

Here's a high-level overview of the algorithm:

- The exact domain "github.io" and every domain under "github.com" are never a GitHub Pages site
- URLs like "sidneynemzer.github.io/stuff" might be the repo "github.com/sidneynemzer/stuff"
- If not, it must be "github.com/sidneynemzer/sidneynemzer.github.io"
- For other domains, if the document response has the header "Server: Github.com", it is hosted by GitHub Pages
  - Check for a CNAME DNS record, which is used for custom subdomains like "mysite.example.com". The CNAME will point to a domain like "sidneynemzer.github.io", which gives us the username. Apex domains like "example.com" don't use a CNAME, so we won't know the username for those domains.
  - The user is prompted to search GitHub for a CNAME file with the hostname. If the repo is public, it should be easy to find. The username can help narrow the search.
