import React from 'react';
import { motion } from 'framer-motion';

export function ShimmerText({
  children,
  className = "",
  duration = 1.5,
  delay = 0,
}) {
  return (
    <div className={`inline-flex overflow-hidden ${className}`}>
      <motion.div
        className="inline-block"
        style={{
          WebkitTextFillColor: "transparent",
          // We blend the base white color with the dynamic tier color for the shimmer!
          background: "linear-gradient(to right, #ffffff 0%, var(--tier-color, rgba(0,0,0,0.5)) 40%, var(--tier-color, rgba(0,0,0,0.5)) 60%, #ffffff 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          backgroundRepeat: "no-repeat",
          backgroundSize: "50% 200%",
          color: "#ffffff"
        }}
        initial={{
          backgroundPositionX: "250%",
        }}
        animate={{
          backgroundPositionX: ["-100%", "250%"],
        }}
        transition={{
          duration: duration,
          delay: delay,
          repeat: Infinity,
          repeatDelay: 1.5,
          ease: "linear",
        }}
      >
        <span>{children}</span>
      </motion.div>
    </div>
  );
}
