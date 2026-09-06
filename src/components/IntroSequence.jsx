import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AppleHelloIntro from "./AppleHelloIntro";
import XoryaLogoIntro from "./XoryaLogoIntro";

const STORAGE_KEY = "xorya_intro_last_shown";
const VERSION_KEY  = "xorya_intro_version";
const ONE_WEEK_MS  = 7 * 24 * 60 * 60 * 1000;

/**
 * Bump this string whenever you deploy a new intro that you want
 * ALL users (including returning ones) to see immediately.
 * After they see it once, the 7-day weekly rotation takes over.
 */
const INTRO_VERSION = "v1";

/**
 * DEV MODE: always show intro on every reload so you can debug/fix it.
 * In production (deployed site), the normal weekly gate applies.
 */
const IS_DEV = typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1" ||
   window.location.hostname.startsWith("192.168."));

/**
 * Returns true if the intro should be shown this visit:
 *  - In DEV mode (localhost) → ALWAYS show, every reload (for debugging)
 *  - Always shows if the user has never seen this INTRO_VERSION
 *  - After first v-versioned view, shows again every 7 days
 */
function shouldShowIntro() {
  // Intro is disabled during testing
  return false;

  // ── Weekly-gate logic (re-enable when going live) ──────────────────────────
  // try {
  //   const seenVersion = localStorage.getItem(VERSION_KEY);
  //   if (seenVersion !== INTRO_VERSION) return true;
  //   const last = localStorage.getItem(STORAGE_KEY);
  //   if (!last) return true;
  //   const lastTime = parseInt(last, 10);
  //   if (isNaN(lastTime)) return true;
  //   return Date.now() - lastTime >= ONE_WEEK_MS;
  // } catch {
  //   return true;
  // }
}

function markIntroShown() {
  // Don't pollute localStorage during dev testing
  if (IS_DEV) return;
  try {
    localStorage.setItem(VERSION_KEY,  INTRO_VERSION);
    localStorage.setItem(STORAGE_KEY,  String(Date.now()));
  } catch {
    // localStorage unavailable (private browsing etc.) — silently ignore
  }
}

/**
 * IntroSequence
 *
 * Stage machine:
 *   'checking' → determine if intros needed
 *   'hello'    → Apple Hello multilingual animation
 *   'logo'     → XORYA SVG draw animation
 *   'bridge'   → 80ms black flash to prevent glitch bleed-through
 *   'done'     → unmount everything, show main site
 *
 * The `children` prop renders the main site content underneath.
 */
export default function IntroSequence({ children }) {
  const [stage, setStage] = useState("checking");

  useEffect(() => {
    if (shouldShowIntro()) {
      markIntroShown();
      // Lock scroll while intro plays
      document.body.style.overflow = "hidden";
      setStage("hello");
    } else {
      document.body.style.overflow = "";
      if (typeof window !== "undefined") {
        window.XORYA_INITIAL_LOAD_COMPLETE = true;
        window.dispatchEvent(new CustomEvent('xorya-intro-complete'));
      }
      setStage("done");
    }
  }, []);

  const handleHelloDone = useCallback(() => {
    // Apple Hello sequence complete — show XORYA logo draw
    setStage("logo");
  }, []);

  const handleLogoDone = useCallback(() => {
    // XORYA logo done — brief black bridge to eliminate bleed-through glitch
    setStage("bridge");
    setTimeout(() => {
      setStage("done");
      document.body.style.overflow = "";
    }, 100); // 100ms is enough to let React commit the unmount cleanly
  }, []);

  const isDone = stage === "done" || stage === "checking";

  return (
    <>
      {/* Main site — always rendered underneath but hidden behind intros */}
      <div
        style={{
          visibility: isDone ? "visible" : "hidden",
          pointerEvents: isDone ? "auto" : "none",
        }}
      >
        {children}
      </div>

      {/* Intro overlay layers */}
      <AnimatePresence>
        {stage === "hello" && (
          <motion.div
            key="apple-hello"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ position: "fixed", inset: 0, zIndex: 9000 }}
          >
            <AppleHelloIntro onComplete={handleHelloDone} />
          </motion.div>
        )}

        {stage === "logo" && (
          <motion.div
            key="xorya-logo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "fixed", inset: 0, zIndex: 9010 }}
          >
            <XoryaLogoIntro onComplete={handleLogoDone} />
          </motion.div>
        )}

        {/* Black bridge frame — prevents any bleed-through during React unmount */}
        {stage === "bridge" && (
          <motion.div
            key="bridge"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9020,
              background: "#000",
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
