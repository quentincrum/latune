export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/latune/sw.js", { scope: "/latune/" })
      .catch((err) => console.error("SW registration failed", err));
  });
}


