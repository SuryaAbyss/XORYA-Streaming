import { useEffect, useRef } from "react";

const LETTER_IDS = ["svgX1", "svgX2", "svgO", "svgR", "svgA1", "svgY", "svgA2"];
const STROKE_DURATION = 3200; // ms — ultra smooth, gentle draw
const FILL_PAUSE = 300;       // soft beat after outline, then fill starts
const FILL_DURATION = 2200;   // soft, luxurious fill fade
const FILL_HOLD = 400;        // moment on filled logo before fade
const FADE_OUT = 800;

function smoothEase(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function XoryaLogoIntro({ onComplete }) {
  const containerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId = 0;
    let layoutId = 0;
    const timeouts = [];
    let cancelled = false;

    layoutId = requestAnimationFrame(() => {
      if (cancelled) return;

      const letters = [];

      LETTER_IDS.forEach((id) => {
        const el = container.querySelector(`#${id}`);
        if (!el) return;

        const len = el.getTotalLength();
        if (len <= 0) return;

        el.style.fill = "rgba(0, 0, 0, 0)";
        el.style.stroke = "#000000";
        el.style.strokeWidth = "10px";
        el.style.strokeLinecap = "round";
        el.style.strokeLinejoin = "round";
        el.style.strokeDasharray = `${len}`;
        el.style.strokeDashoffset = `${len}`;
        letters.push({ el, len });
      });

      if (letters.length === 0) {
        onCompleteRef.current();
        return;
      }

      let startTime = null;

      function offsetMe(timestamp) {
        if (cancelled) return;
        if (!startTime) startTime = timestamp;

        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / STROKE_DURATION, 1);
        const eased = smoothEase(progress);

        letters.forEach(({ el, len }) => {
          el.style.strokeDashoffset = `${len * (1 - eased)}`;
        });

        if (progress < 1) {
          animId = requestAnimationFrame(offsetMe);
        } else {
          letters.forEach(({ el }) => {
            el.style.strokeDashoffset = "0";
          });

          timeouts.push(
            setTimeout(() => {
              if (cancelled || !container) return;
              container.classList.add("stroke-complete");

              timeouts.push(
                setTimeout(() => {
                  if (cancelled || !container) return;
                  container.classList.remove("stroke-complete");
                  container.style.transition = "opacity 0.8s ease-in-out";
                  container.style.opacity = "0";

                  timeouts.push(
                    setTimeout(() => {
                      if (!cancelled) onCompleteRef.current();
                    }, FADE_OUT),
                  );
                }, FILL_DURATION + 720 + FILL_HOLD),
              );
            }, FILL_PAUSE),
          );
        }
      }

      animId = requestAnimationFrame(offsetMe);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(layoutId);
      cancelAnimationFrame(animId);
      timeouts.forEach(clearTimeout);
      if (container) container.classList.remove("stroke-complete");
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ opacity: 1 }}
      className="xorya-logo-intro fixed inset-0 z-[60] flex items-center justify-center bg-white overflow-hidden select-none"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .xorya-logo-intro .svg-intro-container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100vw;
            height: 100vh;
            background-color: #ffffff;
        }

        .xorya-logo-intro .svg-intro-container svg {
            width: min(85vw, 900px);
            height: auto;
            display: block;
            overflow: visible;
        }

        .xorya-logo-intro #svgX1,
        .xorya-logo-intro #svgX2,
        .xorya-logo-intro #svgO,
        .xorya-logo-intro #svgR,
        .xorya-logo-intro #svgA1,
        .xorya-logo-intro #svgY,
        .xorya-logo-intro #svgA2 {
            fill: rgba(0, 0, 0, 0);
            stroke: #000000;
            stroke-width: 10px;
            stroke-linecap: round;
            stroke-linejoin: round;
            transition: fill 2.2s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .xorya-logo-intro.stroke-complete #svgX1 { animation: xorya-logo-fill 2.2s cubic-bezier(0.25, 1, 0.5, 1) 0ms forwards; }
        .xorya-logo-intro.stroke-complete #svgX2 { animation: xorya-logo-fill 2.2s cubic-bezier(0.25, 1, 0.5, 1) 120ms forwards; }
        .xorya-logo-intro.stroke-complete #svgO  { animation: xorya-logo-fill 2.2s cubic-bezier(0.25, 1, 0.5, 1) 240ms forwards; }
        .xorya-logo-intro.stroke-complete #svgR  { animation: xorya-logo-fill 2.2s cubic-bezier(0.25, 1, 0.5, 1) 360ms forwards; }
        .xorya-logo-intro.stroke-complete #svgA1 { animation: xorya-logo-fill 2.2s cubic-bezier(0.25, 1, 0.5, 1) 480ms forwards; }
        .xorya-logo-intro.stroke-complete #svgY  { animation: xorya-logo-fill 2.2s cubic-bezier(0.25, 1, 0.5, 1) 600ms forwards; }
        .xorya-logo-intro.stroke-complete #svgA2 { animation: xorya-logo-fill 2.2s cubic-bezier(0.25, 1, 0.5, 1) 720ms forwards; }

        @keyframes xorya-logo-fill {
            0% { fill: rgba(0, 0, 0, 0); }
            100% { fill: rgba(0, 0, 0, 1); }
        }
      `,
        }}
      />

      <div className="svg-intro-container">
        <svg
          version="1.0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="46 231 302 80"
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform="scale(0.050000, 0.050000)">
            <path id="svgX1" fill="none" d="M1524 5808L1315 5808L1606 5409L1330 5024L1536 5024L1715 5278L1710 5536L1524 5808Z" />
            <path id="svgX2" fill="none" d="M1715 5278L1892 5024L2090 5024L1816 5402L2109 5808L1899 5808L1710 5536L1715 5278Z" />
            <path id="svgO" fill="none" d="M2706 5821Q2613 5821 2534 5791Q2455 5761 2397 5706Q2339 5651 2308 5577Q2276 5503 2276 5416Q2276 5329 2308 5255Q2339 5181 2398 5126Q2456 5071 2534 5041Q2613 5010 2705 5010Q2798 5010 2876 5041Q2953 5071 3011 5126Q3069 5181 3101 5254Q3134 5327 3134 5416Q3134 5503 3101 5578Q3069 5652 3011 5707Q2953 5761 2876 5791Q2798 5821 2706 5821M2705 5667Q2757 5667 2802 5649Q2846 5631 2879 5597Q2913 5564 2932 5518Q2950 5472 2950 5416Q2950 5360 2932 5314Q2913 5268 2880 5234Q2847 5201 2802 5183Q2757 5165 2705 5165Q2652 5165 2608 5183Q2564 5201 2530 5234Q2496 5268 2478 5314Q2459 5360 2459 5416Q2459 5471 2478 5517Q2496 5564 2529 5597Q2562 5631 2607 5649Q2652 5667 2705 5667" />
            <path id="svgR" fill="none" d="M3572 5808L3390 5808L3390 5024L3725 5024Q3889 5024 3980 5099Q4070 5175 4070 5308Q4070 5396 4029 5459Q3988 5522 3911 5556Q3910 5556 3910 5557L4085 5808L3889 5808L3739 5590Q3734 5590 3730 5590L3572 5590L3572 5808M3572 5172L3572 5445L3720 5445Q3804 5445 3845 5409Q3887 5372 3887 5308Q3887 5243 3845 5208Q3804 5172 3720 5172" />
            <path id="svgA1" fill="none" d="M4417 5808L4231 5808L4580 5024L4760 5024L5110 5808L4920 5808L4850 5640L4486 5640L4417 5808M4545 5502L4793 5502L4669 5202" />
            <path id="svgY" fill="none" d="M5688 5808L5507 5808L5507 5528L5203 5024L5396 5024L5606 5372L5815 5024L5993 5024L5688 5530" />
            <path id="svgA2" fill="none" d="M6272 5808L6086 5808L6436 5024L6615 5024L6966 5808L6775 5808L6706 5640L6342 5640L6272 5808M6400 5502L6649 5502L6524 5202" />
          </g>
        </svg>
      </div>
    </div>
  );
}
