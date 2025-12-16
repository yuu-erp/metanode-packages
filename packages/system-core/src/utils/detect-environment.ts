export const isMetanodeWebView = (): boolean => {
  if (typeof window === "undefined") return false;

  return (
    typeof window.webkit === "object" &&
    typeof window.webkit.messageHandlers === "object" &&
    typeof window.webkit.messageHandlers.callbackHandler === "object" &&
    typeof window.webkit.messageHandlers.callbackHandler.postMessage === "function"
  );
};

export const isElectron = (): boolean => {
  if (typeof window === "undefined") return false;

  const w = window as any;

  return typeof w.electronAPI === "object" && typeof w.electronAPI.sendMessage === "function";
};
