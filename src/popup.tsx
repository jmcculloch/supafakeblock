import React from "react";
import { createRoot } from "react-dom/client";

const Popup = () => {
  const version = chrome.runtime.getManifest().version;

  return (
    <>
      <h1>Supafakeblock {version}</h1>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
