// This script is included in `result.html` which renders the result text
// dynamically.

const messageElement = document.querySelector<HTMLElement>("#message");
const descriptionElement = document.querySelector<HTMLElement>("#description");
const anchorElement = document.querySelector<HTMLAnchorElement>("#anchor");

const params = new URLSearchParams(location.search);
const message = params.get("message");
const description = params.get("description");
const url = params.get("url");

if (messageElement && message) {
  messageElement.innerText = message;
}

if (descriptionElement && description) {
  const escaped = description
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  descriptionElement.innerHTML = escaped.replace(/\n/g, "<br />");
}

if (anchorElement && url) {
  anchorElement.innerText = url;
  anchorElement.href = url;
}
