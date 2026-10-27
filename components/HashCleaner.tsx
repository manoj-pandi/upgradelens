"use client";

import { useEffect } from "react";

const isOnScreen = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
};

const HashCleaner = () => {
  useEffect(() => {
    let watchedHash = "";
    let seen = false; 

    const onScroll = () => {
      const hash = window.location.hash;
      if (!hash) return;

      // A new hash (e.g. "#how" -> "#rules") starts a fresh watch.
      if (hash !== watchedHash) {
        watchedHash = hash;
        seen = false;
      }

      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;

      if (isOnScreen(target)) {
        seen = true;
      } else if (seen) {
    
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        watchedHash = "";
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
};

export default HashCleaner;
