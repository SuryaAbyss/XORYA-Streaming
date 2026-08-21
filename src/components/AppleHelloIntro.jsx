import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

// ─── Inline Liquid Glass Button (no external dep needed) ──────────────────────
function LiquidGlassButton({ onClick, children, showWaves = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 32px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        outline: "none",
        borderRadius: "9999px",
        backdropFilter: "blur(12px) saturate(180%) brightness(1.05)",
        WebkitBackdropFilter: "blur(12px) saturate(180%) brightness(1.05)",
        backgroundColor: "rgba(255,255,255,0.22)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.35), 0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)",
        transition: "transform 0.3s cubic-bezier(0.4,1.5,0.3,1), box-shadow 0.3s ease",
        userSelect: "none",
        zIndex: 20,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.04)";
        e.currentTarget.style.boxShadow =
          "inset 0 0 0 1px rgba(255,255,255,0.5), 0 6px 28px rgba(0,0,0,0.22), 0 1px 6px rgba(0,0,0,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow =
          "inset 0 0 0 1px rgba(255,255,255,0.35), 0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.96)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1.04)";
      }}
    >
      {showWaves && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              pointerEvents: "none",
              borderRadius: "inherit",
              overflow: "hidden",
              mask: "repeating-linear-gradient(90deg, transparent 0, transparent 6px, black 7px, black 8px)",
              WebkitMask: "repeating-linear-gradient(90deg, transparent 0, transparent 6px, black 7px, black 8px)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                  radial-gradient(circle at 50% 50%, #f43f5e 0%, transparent 50%),
                  radial-gradient(circle at 45% 45%, #ef4444 0%, transparent 45%),
                  radial-gradient(circle at 55% 55%, #fb7185 0%, transparent 45%)
                `,
                mask: "radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%)",
                WebkitMask: "radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%)",
                animation: "lgb-transform 2s infinite alternate, lgb-opacity 4s infinite",
                animationTimingFunction: "cubic-bezier(0.6, 0.8, 0.5, 1)",
                filter: "drop-shadow(0 0 8px rgba(244, 63, 94, 0.6))",
              }}
            />
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes lgb-transform { 0% { transform: translate(-55%); } 100% { transform: translate(55%); } }
              @keyframes lgb-opacity { 0%, 100% { opacity: 0; } 15% { opacity: 1; } 65% { opacity: 0; } }
            `
          }} />
        </>
      )}
      <span
        style={{
          position: "relative",
          zIndex: 20,
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: "rgba(0,0,0,0.85)",
          userSelect: "none",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {children}
      </span>
    </button>
  );
}

// ─── Play Icon ─────────────────────────────────────────────────────────────────
function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: 16, height: 16, fill: "rgba(0,0,0,0.8)" }}
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

// ─── cn helper ─────────────────────────────────────────────────────────────────
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ─── Shared motion props for paths ────────────────────────────────────────────
const initialPathProps = { pathLength: 0, opacity: 0 };
const animatePathProps = { pathLength: 1, opacity: 1 };

// ─── 1. English — "hello" ─────────────────────────────────────────────────────
function HelloEnglish({ className, durationScale = 1, onAnimationComplete }) {
  const calc = (x) => x * durationScale;
  return (
    <motion.svg
      className={cn("h-20", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-20 -20 678 240"
      fill="none"
      stroke="currentColor"
      strokeWidth="18"
      strokeLinecap="round"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <title>hello</title>
      <motion.path
        d="M8.69214 166.553C36.2393 151.239 61.3409 131.548 89.8191 98.0295C109.203 75.1488 119.625 49.0228 120.122 31.0026C120.37 17.6036 113.836 7.43883 101.759 7.43883C88.3598 7.43883 79.9231 17.6036 74.7122 40.9363C69.005 66.5793 64.7866 96.0036 54.1166 190.356"
        initial={initialPathProps}
        animate={animatePathProps}
        transition={{ duration: calc(0.8), ease: [0.22, 1, 0.36, 1], opacity: { duration: 0.4 } }}
      />
      <motion.path
        d="M55.1624 181.135C60.6251 133.114 81.4118 98.0479 107.963 98.0479C123.844 98.0479 133.937 110.703 131.071 128.817C129.457 139.487 127.587 150.405 125.408 163.06C122.869 178.941 130.128 191.348 152.122 191.348C184.197 191.348 219.189 173.523 237.097 145.915C243.198 136.509 245.68 128.073 245.928 119.884C246.176 104.996 237.739 93.8296 222.851 93.8296C203.992 93.8296 189.6 115.17 189.6 142.465C189.6 171.745 205.481 192.341 239.208 192.341C285.066 192.341 335.86 137.292 359.199 75.8585C365.788 58.513 368.26 42.4065 368.26 31.1512C368.26 17.8057 364.042 7.55823 352.131 7.55823C340.469 7.55823 332.777 16.6141 325.829 30.9129C317.688 47.4967 311.667 71.4162 309.203 98.4549C303 166.301 316.896 191.348 349.936 191.348C390 191.348 434.542 135.534 457.286 75.6686C463.803 58.513 466.275 42.4065 466.275 31.1512C466.275 17.8057 462.057 7.55823 450.146 7.55823C438.484 7.55823 430.792 16.6141 423.844 30.9129C415.703 47.4967 409.682 71.4162 407.218 98.4549C401.015 166.301 414.911 191.348 444.416 191.348C473.874 191.348 489.877 165.67 499.471 138.402C508.955 111.447 520.618 94.8221 544.935 94.8221C565.035 94.8221 580.916 109.71 580.916 137.75C580.916 168.768 560.792 192.093 535.362 192.341C512.984 192.589 498.285 174.475 499.774 147.179C501.511 116.907 519.873 94.8221 543.943 94.8221C557.839 94.8221 569.51 100.999 578.682 107.725C603.549 125.866 622.709 114.656 630.047 96.7186"
        initial={initialPathProps}
        animate={animatePathProps}
        transition={{ duration: calc(2.8), ease: [0.22, 1, 0.36, 1], delay: calc(0.7), opacity: { duration: 0.7, delay: calc(0.7) } }}
        onAnimationComplete={onAnimationComplete}
      />
    </motion.svg>
  );
}

// ─── 2. Hindi — "नमस्ते" ──────────────────────────────────────────────────────
function HelloHindi({ className, durationScale = 0.8, onAnimationComplete }) {
  const calc = (x) => x * durationScale;
  return (
    <motion.svg
      className={cn("h-20", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-20 -20 645 313"
      fill="none"
      stroke="currentColor"
      strokeWidth="14.888"
      strokeLinecap="round"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <title>नमस्ते</title>
      <motion.path d="M42.3842 150.002C53.2928 153.473 60.4984 162.29 60.4984 175.561C60.4984 189.953 50.3247 201.119 36.677 201.119C24.022 201.119 14.8408 192.186 14.8408 179.035C14.8408 160.269 31.2182 148.265 56.5282 149.01C82.0863 149.754 103.723 163.663 120.367 185.069" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.6), ease: "easeOut", opacity: { duration: 0.2 } }} />
      <motion.path d="M133.502 93.5842C124.459 153.875 117.303 209.683 111.71 264.988" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.4), ease: "easeOut", delay: calc(0.6), opacity: { duration: 0.2, delay: calc(0.6) } }} />
      <motion.path d="M216.556 90.9181C217.117 117.977 216.81 137.689 214.869 160.067C212.007 193.058 200.119 213.115 180.936 213.115C169.295 213.115 160.844 205.334 160.844 193.399C160.844 177.222 175.901 164.28 203.653 165.376C229.863 166.411 256.651 174.863 275.138 192.025" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.6), ease: "easeOut", delay: calc(1), opacity: { duration: 0.2, delay: calc(1) } }} />
      <motion.path d="M289.489 90.0085C280.255 150.162 272.672 207.783 267.379 263.003" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.4), ease: "easeOut", delay: calc(1.6), opacity: { duration: 0.2, delay: calc(1.6) } }} />
      <motion.path d="M373.949 90.0198C394.816 102.051 408.098 128.602 408.098 154.079C408.098 185.141 387.465 205.586 358.47 205.586C330.249 205.586 311.145 186.038 317.527 170.35C322.864 157.231 341.378 156.812 356.237 168.861C374.674 183.811 382.044 216.764 385.021 261.169" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.6), ease: "easeOut", delay: calc(2), opacity: { duration: 0.2, delay: calc(2) } }} />
      <motion.path d="M403.474 177.549C418.085 183.32 439.163 184.314 458.424 179.805" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.4), ease: "easeOut", delay: calc(2.6), opacity: { duration: 0.2, delay: calc(2.6) } }} />
      <motion.path d="M556.981 88.1333C546.807 149.619 538.371 207.01 531.919 262.906" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.4), ease: "easeOut", delay: calc(3), opacity: { duration: 0.2, delay: calc(3) } }} />
      <motion.path d="M536.891 222.462C541.984 183.336 528.689 152.484 496.435 152.484C472.365 152.484 453.755 175.064 453.755 203.104C453.755 223.451 461.199 245.784 475.095 261.417" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.6), ease: "easeOut", delay: calc(3.4), opacity: { duration: 0.2, delay: calc(3.4) } }} />
      <motion.path d="M521.259 45.4307C485.619 43.0134 474.856 32.3917 474.856 21.5298C474.856 12.832 482.71 7.04349 493.506 7.46568C518.289 8.37031 542.96 35.3336 555.578 70.4412" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.6), ease: "easeOut", delay: calc(4), opacity: { duration: 0.2, delay: calc(4) } }} />
      <motion.path d="M7.44434 88.6792C30.9102 88.8706 59.0093 89.2085 95.3706 89.2085C132.178 89.2085 208.165 89.2571 253.623 89.2047C295.091 89.1568 396.683 89.0223 452.784 89.0234C506.182 89.0244 552.847 88.4444 596.931 87.2836" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.8), ease: "easeOut", delay: calc(4.6), opacity: { duration: 0.2, delay: calc(4.6) } }} onAnimationComplete={onAnimationComplete} />
    </motion.svg>
  );
}

// ─── 3. Spanish — "hola" ──────────────────────────────────────────────────────
function HelloSpanish({ className, durationScale = 0.45, onAnimationComplete }) {
  const calc = (x) => x * durationScale;
  return (
    <motion.svg
      className={cn("h-20", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-20 -20 602 240"
      fill="none"
      stroke="currentColor"
      strokeWidth="14.888"
      strokeLinecap="round"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <title>hola</title>
      <motion.path d="M8.692 169.422c27.495-16.185 51.282-36.493 77.822-72.424 18.627-25.219 27.738-47.893 28.236-65.962.248-13.399-6.204-23.563-18.362-23.563-13.4 0-21.837 10.164-27.048 33.497-5.707 25.643-9.925 55.067-20.595 149.42" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.8), ease: "easeOut", opacity: { duration: 0.4 } }} />
      <motion.path d="M49.79 181.168c5.265-46.274 26.25-83.086 52.801-83.086 15.881 0 25.974 12.655 23.108 30.769-1.613 10.67-4.528 23.077-6.193 35.236-2.026 15.384 3.761 27.295 21.655 27.295 25.257 0 41.157-24.523 48.037-53.562" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.8), ease: "easeInOut", delay: calc(0.7), opacity: { duration: 0.2, delay: calc(0.8) } }} />
      <motion.path d="M234.601 94.36c-24.822 2.006-43.39 23.044-46.898 51.861-3.226 26.302 11.414 46.154 34.739 46.154 28.288 0 46.65-24.318 47.891-54.591.992-29.032-12.903-43.672-31.762-43.672-14.888 0-22.829 11.166-22.332 24.813.484 18.661 14.478 39.612 43.839 42.289 40.725 3.714 96.424-26.396 118.914-85.593 6.487-17.074 8.959-33.18 8.959-44.436 0-13.346-4.219-23.593-16.129-23.593-11.663 0-19.355 9.056-26.303 23.355-8.14 16.583-14.162 40.503-16.625 67.542-6.204 67.846 7.692 92.893 37.42 92.893 30.127 0 50.049-26.113 58.664-56.317" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(1.6), ease: "easeInOut", delay: calc(1.4), opacity: { duration: 0.2, delay: calc(1.5) } }} />
      <motion.path d="M503.236 112.864c-4.864-11.195-15.204-18.753-31.664-18.753-27.295 0-47.808 27.296-49.155 56.576-1.174 26.799 11.192 41.864 28.805 41.687 25.001-.25 43.378-24.805 51.581-76.763 1.012-6.41 2.061-13.104 3.073-19.514" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.7), ease: "easeInOut", delay: calc(2.9), opacity: { duration: 0.2, delay: calc(3) } }} />
      <motion.path d="m505.875 96.097-3.073 19.507c-4.482 28.44-6.549 39.66-6.327 46.994.518 17.121 6.675 28.784 22.06 28.784 19.355 0 30.21-13.152 35.421-27.544" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.8), ease: "easeInOut", delay: calc(3.5), opacity: { duration: 0.2, delay: calc(3.5) } }} onAnimationComplete={onAnimationComplete} />
    </motion.svg>
  );
}

// ─── 4. Vietnamese — "xin chào" ───────────────────────────────────────────────
function HelloVietnamese({ className, durationScale = 0.45, onAnimationComplete }) {
  const calc = (x) => x * durationScale;
  return (
    <motion.svg
      className={cn("h-20", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-30 -30 1069 260"
      fill="none"
      stroke="currentColor"
      strokeWidth="22"
      strokeLinecap="round"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <title>xin chào</title>
      <motion.path d="M102.233 96.2277C75.6823 127.245 45.1612 158.759 11.4143 190.521" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.3), ease: "easeInOut", opacity: { duration: 0.15 } }} />
      <motion.path d="M7.69214 116.575C9.67725 105.16 16.8733 95.7311 28.5358 95.7311C40.4465 95.7311 46.8981 105.408 53.3497 124.019C56.7409 133.283 60.1322 142.547 63.5234 151.81C73.689 179.58 81.1988 191.513 100.855 191.513C128.722 191.513 154.043 159.148 161.595 118.502C162.929 111.321 164.774 103.736 166.043 96.2273" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.7), ease: "easeInOut", delay: calc(0.4), opacity: { duration: 0.35, delay: calc(0.4) } }} />
      <motion.path d="M166.043 96.2273C163.191 113.101 160.565 126.997 158.92 139.404C157.989 147.592 157.544 154.54 157.596 161.488C157.729 179.354 164.764 191.513 182.695 191.513C209.39 191.513 236.181 159.123 243.73 118.5C245.064 111.321 247.012 103.759 248.139 96.2273" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.5), ease: "easeOut", delay: calc(1), opacity: { duration: 0.25, delay: calc(1) } }} />
      <motion.path d="M248.139 96.2278C243.424 127.741 239.454 158.759 234.491 190.272" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.3), ease: "easeOut", delay: calc(1.5), opacity: { duration: 0.15, delay: calc(1.5) } }} />
      <motion.path d="M237.873 167.951C244.704 121.32 265.508 94.2422 290.322 94.2422C307.692 94.2422 316.625 106.153 315.136 123.026C313.896 135.681 309.677 150.322 308.685 162.729C307.444 179.85 316.499 191.513 330.769 191.513C348.722 191.513 359.309 179.314 364.143 165.965" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.9), ease: "easeOut", delay: calc(1.8), opacity: { duration: 0.45, delay: calc(1.8) } }} />
      <motion.path d="M535.91 109.876C531.265 100.446 520.943 93.4984 505.459 93.4984C476.516 93.4984 462.044 117.816 462.044 143.374C462.044 171.503 482.265 192.506 511.307 192.506C559.762 192.506 592.902 136.708 621.581 97.8807C640.764 71.9101 649.874 49.2359 650.372 31.1674C650.62 17.7684 644.168 7.60362 632.01 7.60362C618.61 7.60362 610.173 17.7684 604.963 41.1011C599.255 66.7441 595.037 96.1684 584.367 190.521" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(1.1), ease: "easeInOut", delay: calc(2.6), opacity: { duration: 0.55, delay: calc(2.6) } }} />
      <motion.path d="M585.413 181.299C590.677 135.025 611.663 98.2125 638.213 98.2125C654.094 98.2125 664.187 110.868 661.321 128.982C659.708 139.652 656.794 152.059 655.128 164.217C653.102 179.602 658.89 191.513 676.813 191.513C702.178 191.513 717.375 164.077 725.613 135.196" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(1), ease: "easeInOut", delay: calc(3.6), opacity: { duration: 0.5, delay: calc(3.6) } }} />
      <motion.path d="M803.871 112.995C799.007 101.8 788.666 94.2423 772.207 94.2423C744.912 94.2423 724.398 121.538 723.052 150.818C721.878 177.617 734.244 192.681 751.857 192.505C776.858 192.255 795.234 167.699 803.437 115.742C804.449 109.332 805.498 102.638 806.51 96.2274" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.8), ease: "easeOut", delay: calc(4.6), opacity: { duration: 0.4, delay: calc(4.6) } }} />
      <motion.path d="M806.51 96.2274C805.486 102.73 804.461 109.232 803.436 115.735C798.955 144.175 796.887 155.395 797.109 162.729C797.628 179.85 803.785 191.513 820.064 191.513C842.563 191.513 860.966 164.721 870.266 138.289C879.653 111.612 891.315 94.9867 915.633 94.9867C935.732 94.9867 951.613 109.875 951.613 137.915C951.613 168.932 931.489 192.257 906.059 192.505C883.681 192.753 868.983 174.639 870.471 147.344C872.208 117.071 890.571 94.9867 914.64 94.9867C928.536 94.9867 940.207 101.164 949.38 107.89C974.247 126.031 993.407 114.82 1000.74 96.8832" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(1.5), ease: "easeOut", delay: calc(5.4), opacity: { duration: 0.75, delay: calc(5.4) } }} />
      <motion.path d="M763.027 19.3039C768.734 34.6886 780.397 48.3362 792.059 55.5322" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.8), ease: "easeInOut", delay: calc(7), opacity: { duration: 0.4, delay: calc(7) } }} onAnimationComplete={onAnimationComplete} />
    </motion.svg>
  );
}

// ─── 5. French — "bonjour" ────────────────────────────────────────────────────
function HelloFrench({ className, durationScale = 0.45, onAnimationComplete }) {
  const calc = (x) => x * durationScale;
  return (
    <motion.svg
      className={cn("h-20", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-242 -464 4054 1364"
      fill="none"
      stroke="currentColor"
      strokeWidth="110"
      strokeLinecap="round"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <title>bonjour</title>
      <g transform="scale(1, -1) translate(0, -435.6199951171875)">
        <motion.path d="M-92.45359802246094,74.660400390625 C71.46769714355469,131.75210571289062 182.9971923828125,246.96530151367188 298.6625061035156,489.3955078125 C328.46258544921875,551.8552856445312 338.9466857910156,609.31787109375 341.9779968261719,653.3721923828125 C345,709.4398803710938 322,749.6199951171875 277,749.6199951171875 C232,749.6199951171875 202,717.280029296875 169,648.6799926757812 C130,566.3599853515625 107,468.3599853515625 95,370.3599853515625 C64,96.94000244140625 129,-4 238,-4 C328,-4 385,77 392,184 C396,274 358,344 290,377" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.9), ease: [0.22, 1, 0.36, 1], opacity: { duration: 0.4 } }} />
        <motion.path d="M349.56304931640625,329.85150146484375 C450.0641784667969,205.14019775390625 613.7254028320312,294.54595947265625 689.689697265625,351.093994140625 C722.9686889648438,375.86700439453125 752.3222045898438,385 788,385 C867,385 929,325 929,212 C929,87 850,-7 750,-8 C662,-9 604,64 610,174 C617,296 689,385 784,385 C838,385 876,366 920,333 C1043.56982421875,240.5821990966797 1167.879638671875,285.28936767578125 1198,380" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.9), ease: [0.22, 1, 0.36, 1], delay: calc(0.7), opacity: { duration: 0.2, delay: calc(0.7) } }} />
        <motion.path d="M1198,380 C1179,253 1163,128 1143,1" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.5), ease: [0.22, 1, 0.36, 1], delay: calc(1.4), opacity: { duration: 0.15, delay: calc(1.4) } }} />
        <motion.path d="M1156.63037109375,90.95342254638672 C1184.15869140625,278.8768005371094 1268,388 1368,388 C1438,388 1474,340 1468,272 C1463,221 1446,162 1442,112 C1437,43 1469,-4 1538.50048828125,-4 C1642.873046875,-4 1747.0008544921875,127.54780578613281 1777.2442626953125,290.31475830078125 C1782.6065673828125,319.1737365722656 1790.415771484375,350.5982666015625 1794,381" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.9), ease: [0.22, 1, 0.36, 1], delay: calc(1.7), opacity: { duration: 0.2, delay: calc(1.7) } }} />
        <motion.path d="M1794,381 C1775.3333740234375,222.66665649414062 1756.6666259765625,64.33331298828125 1738,-94 C1719.483642578125,-251.05780029296875 1673,-314 1603,-314 C1556,-314 1522,-284.0697937011719 1522,-236 C1522,-171.7718048095703 1570.7403564453125,-125.66320037841797 1679.189697265625,-92.1765365600586 C1866.2293701171875,-34.42295837402344 2002.8282470703125,75.93299865722656 2047.70703125,203.48324584960938 C2088,318 2135,385 2233,385 C2314,385 2378,325 2378,212 C2378,87 2296.90087890625,-7 2194.41845703125,-8 C2104.234130859375,-9 2045,64 2051,174 C2058,296 2132,385 2229,385 C2285,385 2324,366 2369,333 C2506.075439453125,233.00228881835938 2619.94677734375,280.4041442871094 2660.395263671875,379.2782897949219" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(1.5), ease: [0.22, 1, 0.36, 1], delay: calc(2.4), opacity: { duration: 0.4, delay: calc(2.4) } }} />
        <motion.path d="M2660.395263671875,379.2782897949219 C2643.1162109375,306.2179870605469 2631.5341796875,247 2625.38037109375,203 C2620.2685546875,171 2617.066650390625,149 2615.81884765625,122 C2614.167236328125,50.9989013671875 2653.994384765625,0 2731,0 C2843,0 2898.651123046875,99.65470123291016 2932.39306640625,263.0910949707031 C2940.46337890625,302.1805725097656 2949.257080078125,339.4844665527344 2956.37158203125,378.75750732421875" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.9), ease: [0.22, 1, 0.36, 1], delay: calc(3.6), opacity: { duration: 0.2, delay: calc(3.6) } }} />
        <motion.path d="M2956.37158203125,378.75750732421875 C2931.37158203125,240.75750732421875 2911,158 2911,112 C2911,43 2938,-4 3011.62255859375,-4 C3130.4892578125,-4 3231.96728515625,164.47109985351562 3283,393" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.9), ease: [0.22, 1, 0.36, 1], delay: calc(4.3), opacity: { duration: 0.2, delay: calc(4.3) } }} />
        <motion.path d="M3275.099853515625,359.0414733886719 C3399.099609375,353.0414733886719 3454,328 3454,269 C3454,228 3434,165 3428,119 C3417,39 3446.5087890625,-5 3510,-5 C3587.20361328125,-5 3640.627685546875,46.289573669433594 3661.471923828125,98.4000015258789" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.9), ease: [0.22, 1, 0.36, 1], delay: calc(5.0), opacity: { duration: 0.2, delay: calc(5.0) } }} />
        <motion.path d="M1815,588 L1815,590" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.2), ease: [0.22, 1, 0.36, 1], delay: calc(5.8), opacity: { duration: 0.1, delay: calc(5.8) } }} onAnimationComplete={onAnimationComplete} />
      </g>
    </motion.svg>
  );
}

// ─── 6. Japanese — "こんにちは" ──────────────────────────────────────────────
function HelloJapanese({ className, durationScale = 0.45, onAnimationComplete }) {
  const calc = (x) => x * durationScale;
  return (
    <motion.svg
      className={cn("h-20", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-24 -151 3781 978"
      fill="none"
      stroke="currentColor"
      strokeWidth="105"
      strokeLinecap="round"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <title>こんにちは</title>
      <g transform="scale(1, -1) translate(0, -676.0837194919586)">
        <motion.path d="M182.59060668945312,634.7144775390625 C303.1365966796875,632.6929931640625 428.3489074707031,601.1417846679688 478.18170166015625,570.9302978515625 C512.6984252929688,550.0042724609375 523.6090087890625,528.3734741210938 523.5003051757812,505.76129150390625 C523.317626953125,467.7738037109375 487.894287109375,441.43798828125 444.943115234375,427.9442138671875" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.6), ease: [0.22, 1, 0.36, 1], opacity: { duration: 0.2 } }} />
        <motion.path d="M210.8094940185547,278.1990051269531 C156.28970336914062,237.30470275878906 131.61929321289062,193.3643035888672 129.28050231933594,145.43710327148438 C125.88829803466797,75.92649841308594 183.35780334472656,30.6481990814209 294.79229736328125,27.569599151611328 C395.6520080566406,24.783000946044922 494.6593017578125,43.09550094604492 552.9559936523438,75.256103515625" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.6), ease: [0.22, 1, 0.36, 1], delay: calc(0.5), opacity: { duration: 0.2, delay: calc(0.5) } }} />
        <motion.path d="M969.8612060546875,668.06982421875 C881.7718505859375,498.5282897949219 772.01611328125,224.75509643554688 714.8424072265625,12.263199806213379" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.7), ease: [0.22, 1, 0.36, 1], delay: calc(1.0), opacity: { duration: 0.25, delay: calc(1.0) } }} />
        <motion.path d="M714.9254150390625,12.394599914550781 C777.888427734375,176.2324981689453 853.0667114257812,267.560302734375 933.33740234375,267.75250244140625 C983.592041015625,267.872802734375 1015.5756225585938,236.5207061767578 1026.858154296875,169.11109924316406 C1029.2435302734375,154.8587646484375 1031.6290283203125,140.60643005371094 1034.014404296875,126.3541030883789 C1046.40087890625,52.348899841308594 1078.71240234375,21.547800064086914 1132.1763916015625,21.547800064086914 C1202.151611328125,21.547800064086914 1278.019287109375,82.6322021484375 1316.994384765625,184.02650451660156" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.9), ease: [0.22, 1, 0.36, 1], delay: calc(1.6), opacity: { duration: 0.3, delay: calc(1.6) } }} />
        <motion.path d="M1568.0235595703125,664.0040893554688 C1525.9976806640625,465.33819580078125 1498.87890625,215.94410705566406 1492.9129638671875,-1.1238000392913818" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.7), ease: [0.22, 1, 0.36, 1], delay: calc(2.4), opacity: { duration: 0.25, delay: calc(2.4) } }} />
        <motion.path d="M1730.877197265625,553.5394897460938 C1832.02197265625,565.2670288085938 1936.3548583984375,554.1740112304688 1979.046875,533.1331787109375 C2007.23486328125,519.2409057617188 2016.310546875,500.6206970214844 2016.284912109375,480.69000244140625 C2016.2401123046875,446.1796875 1986.6949462890625,418.30108642578125 1950.8187255859375,401.23919677734375" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.6), ease: [0.22, 1, 0.36, 1], delay: calc(3.0), opacity: { duration: 0.2, delay: calc(3.0) } }} />
        <motion.path d="M1752.5166015625,256.6610107421875 C1706.57470703125,218.718505859375 1685.8580322265625,178.44729614257812 1684.0184326171875,134.88250732421875 C1681.2376708984375,69.02519989013672 1730.0203857421875,27.827899932861328 1824.176513671875,26.699899673461914 C1909.3907470703125,25.679000854492188 1992.980712890625,43.565799713134766 2042.139404296875,73.28299713134766" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.6), ease: [0.22, 1, 0.36, 1], delay: calc(3.5), opacity: { duration: 0.2, delay: calc(3.5) } }} />
        <motion.path d="M2214.16650390625,558.7841186523438 C2264.333251953125,521.9761962890625 2359.007568359375,483.1317138671875 2505.75732421875,489.0091857910156 C2636.803955078125,494.2576904296875 2697.310791015625,543.9284057617188 2697.310791015625,598.8314208984375 C2697.310791015625,638.6129760742188 2668.89306640625,663.1702270507812 2614.88671875,663.1702270507812 C2488.304931640625,663.1702270507812 2368.138427734375,528.3511962890625 2270.450927734375,240.76759338378906" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.9), ease: [0.22, 1, 0.36, 1], delay: calc(4.0), opacity: { duration: 0.3, delay: calc(4.0) } }} />
        <motion.path d="M2270.450927734375,240.76759338378906 C2360.478515625,297.2325134277344 2462.906494140625,332.30621337890625 2561.46923828125,332.30621337890625 C2685.126220703125,332.30621337890625 2738.69775390625,275.1437072753906 2738.42626953125,190.34820556640625 C2738.037109375,68.73690032958984 2603.4560546875,4.63040018081665 2465.37451171875,4.63040018081665 C2378.043701171875,4.63040018081665 2309.32080078125,22.3341007232666 2276.157470703125,43.39339828491211" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.7), ease: [0.22, 1, 0.36, 1], delay: calc(4.8), opacity: { duration: 0.25, delay: calc(4.8) } }} />
        <motion.path d="M3040.0234375,660.71142578125 C2997.99755859375,464.01251220703125 2970.87890625,217.0876007080078 2964.912841796875,2.1689000129699707" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.7), ease: [0.22, 1, 0.36, 1], delay: calc(5.4), opacity: { duration: 0.25, delay: calc(5.4) } }} />
        <motion.path d="M3190.17236328125,502.30419921875 C3279.12890625,493.2984924316406 3493.351318359375,505.32550048828125 3606.81640625,519.69580078125" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.5), ease: [0.22, 1, 0.36, 1], delay: calc(6.0), opacity: { duration: 0.15, delay: calc(6.0) } }} />
        <motion.path d="M3410.51025390625,677.20751953125 C3422.29248046875,572.3953247070312 3426.3359375,443.44659423828125 3422.464599609375,299.1712951660156 C3417.2431640625,104.5811996459961 3346.681640625,15.3927001953125 3244.98876953125,13.47029972076416 C3178.0615234375,12.2052001953125 3142.810546875,51.19340133666992 3143.471923828125,98.4728012084961 C3144.208740234375,151.164794921875 3189.891845703125,191.86520385742188 3273.421875,192.05020141601562 C3369.95166015625,192.26409912109375 3455.256591796875,140.7906036376953 3575.28955078125,27.99220085144043" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.9), ease: [0.22, 1, 0.36, 1], delay: calc(6.4), opacity: { duration: 0.3, delay: calc(6.4) } }} onAnimationComplete={onAnimationComplete} />
      </g>
    </motion.svg>
  );
}

// ─── 7. Chinese — "你好" ──────────────────────────────────────────────────────
function HelloChinese({ className, durationScale = 0.45, onAnimationComplete }) {
  const calc = (x) => x * durationScale;
  return (
    <motion.svg
      className={cn("h-20", className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-22 -148 2116 1027"
      fill="none"
      stroke="currentColor"
      strokeWidth="90"
      strokeLinecap="round"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <title>你好</title>
      <g transform="scale(1, -1) translate(0, -731)">
        <motion.path d="M285,736 C216,605.6666259765625 147,475.33331298828125 78,345" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.6), ease: [0.22, 1, 0.36, 1], opacity: { duration: 0.2 } }} />
        <motion.path d="M211,584 C223,407 218,117 207,-2" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.6), ease: [0.22, 1, 0.36, 1], delay: calc(0.55), opacity: { duration: 0.2, delay: calc(0.55) } }} />
        <motion.path d="M567,779 C509.3333435058594,675.6666870117188 451.6666564941406,572.3333129882812 394,469" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.5), ease: [0.22, 1, 0.36, 1], delay: calc(1.1), opacity: { duration: 0.15, delay: calc(1.1) } }} />
        <motion.path d="M394,469 C475.9014892578125,571.8762817382812 590.74609375,651 728,651 C798,651 844,619 844,557 C844,503 811,455 762,425" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.8), ease: [0.22, 1, 0.36, 1], delay: calc(1.5), opacity: { duration: 0.25, delay: calc(1.5) } }} />
        <motion.path d="M595,436 C606,366 618,221 618,89 C618,-5 595,-46 534,-47 C456,-48 375.84490966796875,35.37379837036133 375.8900146484375,108.37449645996094 C375.91351318359375,146.375 391.9342956542969,180.03729248046875 432.9537048339844,211.17140197753906 C490.49969482421875,255.5749053955078 609,287 724,285 C828,283 877,240 877,171 C877,108 848,51 806,10" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(1.2), ease: [0.22, 1, 0.36, 1], delay: calc(2.2), opacity: { duration: 0.4, delay: calc(2.2) } }} />
        <motion.path d="M1370.3753662109375,761.638671875 C1281.281005859375,557.6024169921875 1228.8310546875,391.9953918457031 1228.8310546875,309.51910400390625 C1228.8310546875,206.37730407714844 1361.490478515625,40.56380081176758 1468.82421875,-15.850600242614746" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.9), ease: [0.22, 1, 0.36, 1], delay: calc(3.3), opacity: { duration: 0.3, delay: calc(3.3) } }} />
        <motion.path d="M1452.9091796875,541 C1431.9091796875,309 1365.9091796875,140 1307.9091796875,68 C1272.9091796875,24 1233.9091796875,3 1180.9091796875,4 C1111.9091796875,6 1042.9091796875,79 1035.9091796875,185 C1031.9091796875,245 1047.9091796875,299 1075.9091796875,345 C1161.9091796875,487 1370.9091796875,562 1517.9091796875,562" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(1.0), ease: [0.22, 1, 0.36, 1], delay: calc(4.1), opacity: { duration: 0.35, delay: calc(4.1) } }} />
        <motion.path d="M1609.9091796875,707 C1639.6414794921875,743.9091186523438 1684.9091796875,772 1744.9091796875,770 C1800.9091796875,768 1834.9091796875,738 1836.9091796875,688 C1839.9090576171875,620.0031127929688 1781.781005859375,559.9359130859375 1669.9091796875,504" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(0.8), ease: [0.22, 1, 0.36, 1], delay: calc(5.0), opacity: { duration: 0.25, delay: calc(5.0) } }} />
        <motion.path d="M1669.9091796875,504 C1746.843017578125,444.8200988769531 1799.8367919921875,343.0945129394531 1808.9091796875,206 C1819.9091796875,44 1777.9091796875,-38 1705.9091796875,-38 C1623.9091796875,-38 1533.9091796875,84 1529.9091796875,192 C1527.9091796875,250 1548.9722900390625,288.031494140625 1604.9091796875,316 C1689.9091796875,359 1866.9091796875,354 1993.9091796875,307" initial={initialPathProps} animate={animatePathProps} transition={{ duration: calc(1.1), ease: [0.22, 1, 0.36, 1], delay: calc(5.7), opacity: { duration: 0.35, delay: calc(5.7) } }} onAnimationComplete={onAnimationComplete} />
      </g>
    </motion.svg>
  );
}

// ─── Shader Gradient Presets ──────────────────────────────────────────────────
const shaderProps = [
  { type: "waterPlane", animate: "on", brightness: 1.2, cAzimuthAngle: 180, cDistance: 2.4, cPolarAngle: 95, cameraZoom: 1, color1: "#ff6a1a", color2: "#c73c00", color3: "#FD4912", envPreset: "city", grain: "off", lightType: "3d", positionX: 0, positionY: -2.1, positionZ: 0, reflection: 0.1, rotationX: 0, rotationY: 0, rotationZ: 225, uAmplitude: 0, uDensity: 1.8, uFrequency: 5.5, uSpeed: 0.2, uStrength: 3 },
  { type: "sphere", animate: "on", brightness: 1.5, cAzimuthAngle: 250, cDistance: 1.5, cPolarAngle: 140, cameraZoom: 12.5, color1: "#809bd6", color2: "#910aff", color3: "#af38ff", envPreset: "city", grain: "on", lightType: "3d", positionX: 0, positionY: 0, positionZ: 0, reflection: 0.5, rotationX: 0, rotationY: 0, rotationZ: 140, uAmplitude: 7, uDensity: 0.8, uFrequency: 5.5, uSpeed: 0.3, uStrength: 0.4 },
  { type: "waterPlane", animate: "on", brightness: 1.2, cAzimuthAngle: 170, cDistance: 4.4, cPolarAngle: 70, cameraZoom: 1, color1: "#94ffd1", color2: "#6bf5ff", color3: "#ffffff", envPreset: "city", grain: "off", lightType: "3d", positionX: 0, positionY: 0.9, positionZ: -0.3, reflection: 0.1, rotationX: 45, rotationY: 0, rotationZ: 0, uAmplitude: 0, uDensity: 1.2, uFrequency: 0, uSpeed: 0.2, uStrength: 3.4 },
  { type: "sphere", animate: "on", brightness: 0.8, cAzimuthAngle: 270, cDistance: 0.5, cPolarAngle: 180, cameraZoom: 15.1, color1: "#73bfc4", color2: "#ff810a", color3: "#8da0ce", envPreset: "city", grain: "on", lightType: "env", positionX: -0.1, positionY: 0, positionZ: 0, reflection: 0.4, rotationX: 0, rotationY: 130, rotationZ: 70, uAmplitude: 3.2, uDensity: 0.8, uFrequency: 5.5, uSpeed: 0.3, uStrength: 0.3 },
  { type: "waterPlane", animate: "on", brightness: 1, cAzimuthAngle: 180, cDistance: 2.8, cPolarAngle: 80, cameraZoom: 9.1, color1: "#606080", color2: "#8d7dca", color3: "#212121", envPreset: "city", grain: "on", lightType: "3d", positionX: 0, positionY: 0, positionZ: 0, reflection: 0.1, rotationX: 50, rotationY: 0, rotationZ: -60, uAmplitude: 0, uDensity: 1.5, uFrequency: 0, uSpeed: 0.3, uStrength: 1.5 },
  { type: "sphere", animate: "on", brightness: 1.1, cAzimuthAngle: 0, cDistance: 7.1, cPolarAngle: 140, cameraZoom: 17.3, color1: "#ffffff", color2: "#ffbb00", color3: "#0700ff", envPreset: "city", grain: "off", lightType: "3d", positionX: 0, positionY: 0, positionZ: 0, reflection: 0.1, rotationX: 0, rotationY: 0, rotationZ: 0, uAmplitude: 1.4, uDensity: 1.1, uFrequency: 5.5, uSpeed: 0.1, uStrength: 1 },
  { type: "sphere", animate: "on", brightness: 1.5, cAzimuthAngle: 60, cDistance: 7.1, cPolarAngle: 90, cameraZoom: 15.3, color1: "#ff7a33", color2: "#33a0ff", color3: "#ffc53d", envPreset: "dawn", grain: "off", lightType: "3d", positionX: 0, positionY: -0.15, positionZ: 0, reflection: 0.1, rotationX: 0, rotationY: 0, rotationZ: 0, uAmplitude: 1.4, uDensity: 1.1, uFrequency: 5.5, uSpeed: 0.1, uStrength: 0.4 },
];

const textThemes = [
  "text-amber-100",
  "text-zinc-50",
  "text-teal-950",
  "text-zinc-50",
  "text-indigo-100",
  "text-indigo-950",
  "text-amber-100",
];

const languageLabels = ["English", "Hindi", "Spanish", "Vietnamese", "French", "Japanese", "Chinese"];

// ─── Main AppleHelloIntro Component ───────────────────────────────────────────
export default function AppleHelloIntro({ onComplete }) {
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleAnimationEnd = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next >= 7) {
          // All languages done, call onComplete directly
          // But we still want to show the last one briefly, so we handle it specially
          return prev;
        }
        return next;
      });
      setIsTransitioning(false);
    }, 1800);
  }, [isTransitioning]);

  // Special: after last language finishes we call onComplete
  const handleLastAnimationEnd = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      onComplete();
    }, 1800);
  }, [isTransitioning, onComplete]);

  const demos = [
    <HelloEnglish key="en" durationScale={0.95} className="w-full max-w-[280px] sm:max-w-[480px] md:max-w-[600px] h-auto" onAnimationComplete={index === 6 ? handleLastAnimationEnd : handleAnimationEnd} />,
    <HelloHindi key="hi" durationScale={0.45} className="w-full max-w-[280px] sm:max-w-[480px] md:max-w-[600px] h-auto" onAnimationComplete={index === 6 ? handleLastAnimationEnd : handleAnimationEnd} />,
    <HelloSpanish key="es" durationScale={0.45} className="w-full max-w-[280px] sm:max-w-[480px] md:max-w-[600px] h-auto" onAnimationComplete={index === 6 ? handleLastAnimationEnd : handleAnimationEnd} />,
    <HelloVietnamese key="vi" durationScale={0.45} className="w-full max-w-[340px] sm:max-w-[550px] md:max-w-[750px] h-auto" onAnimationComplete={index === 6 ? handleLastAnimationEnd : handleAnimationEnd} />,
    <HelloFrench key="fr" durationScale={0.45} className="w-full max-w-[340px] sm:max-w-[550px] md:max-w-[750px] h-auto" onAnimationComplete={index === 6 ? handleLastAnimationEnd : handleAnimationEnd} />,
    <HelloJapanese key="ja" durationScale={0.45} className="w-full max-w-[340px] sm:max-w-[550px] md:max-w-[750px] h-auto" onAnimationComplete={index === 6 ? handleLastAnimationEnd : handleAnimationEnd} />,
    <HelloChinese key="zh" durationScale={0.45} className="w-full max-w-[340px] sm:max-w-[550px] md:max-w-[750px] h-auto" onAnimationComplete={handleLastAnimationEnd} />,
  ];

  return (
    <div
      className="fixed inset-0 z-[40] overflow-hidden select-none bg-black"
      style={{ willChange: "opacity" }}
    >
      {/* Black curtain fade-in reveal */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute inset-0 z-30 bg-black pointer-events-none"
      />

      {/* Shader Gradient Background */}
      <div className="absolute inset-0 z-0 bg-neutral-950 pointer-events-none">
        <ShaderGradientCanvas
          style={{ position: "absolute", inset: 0 }}
          pixelDensity={1.2}
          fov={45}
        >
          <ShaderGradient
            control="props"
            enableTransition={true}
            smoothTime={2.0}
            {...shaderProps[index]}
          />
        </ShaderGradientCanvas>
      </div>

      {/* Content */}
      <div
        className={`relative z-10 flex min-h-screen flex-col items-center justify-center p-6 transition-colors duration-1000 ${textThemes[index]} pointer-events-none`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ scale: 0.96, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.04, opacity: 0, y: -15 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center w-full"
          >
            <div className="flex items-center justify-center min-h-[160px] md:min-h-[220px]">
              {demos[index]}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-xs tracking-[0.3em] uppercase font-medium select-none"
            >
              {languageLabels[index]}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
