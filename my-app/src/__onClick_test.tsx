import React from "react";

const requestMedia = async (): Promise<void> => {
  await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
};

export const Test = () => (
  <button onClick={requestMedia}>x</button>
);