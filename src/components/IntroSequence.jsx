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
 * Returns true if the intro should be shown this visit:
 *  - Always shows if the user has never seen this INTRO_VERSION
 *  - After first v-versioned view, shows again every 7 days
 */
function shouldShowIntro() {
  try {
    const seenVersion = localStorage.getItem(VERSION_KEY);
    // Force-show for this version if they haven't seen it yet
    if (seenVersion !== INTRO_VERSION) return true;

    // They've already seen v1 — apply weekly rotation
    const last = localStorage.getItem(STORAGE_KEY);
    if (!last) return true;
    const lastTime = parseInt(last, 10);
    if (isNaN(lastTime)) return true;
    return Date.now() - lastTime >= ONE_WEEK_MS;
  } catch {
    return true;
  }
}

function markIntroShown() {
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
