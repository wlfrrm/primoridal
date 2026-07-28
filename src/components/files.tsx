import React from "react";
import type { Configuration } from "./snapshot";

type JSONUploaderProps = {
  callback: (data: Configuration) => void;
  children: React.ReactNode;
};

export function JSONUploader({
  callback,
  children
}: JSONUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    file.text().then(text => {
      try {
        const json = JSON.parse(text);
        callback(json);
      } catch (err) {
        console.error("Invalid JSON", err);
      }
    });
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".sup"
        hidden
        onChange={handleUpload}
      />

      <div onClick={() => inputRef.current?.click()}>
        {children}
      </div>
    </>
  );
}

export function downloadJSON(data: object, filename = "data.json") {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
