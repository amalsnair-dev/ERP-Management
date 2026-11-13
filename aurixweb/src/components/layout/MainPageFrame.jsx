import React from "react";

const MainPageFrame = ({ children, panelClassName = "" }) => {
  return (
    <div className="app-frame-root">
      <div className={`app-frame-panel ${panelClassName}`.trim()}>{children}</div>
    </div>
  );
};

export default MainPageFrame;
