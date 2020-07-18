import React from "react";
import ReactDom from "react-dom";

import Popup from "./components/Popup";

const root = document.querySelector("#root");
if (!root) {
  throw new Error("missing root");
}

ReactDom.render(<Popup />, root);
