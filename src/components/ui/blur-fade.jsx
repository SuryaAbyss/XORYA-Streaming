"use client";

import React, { useRef, forwardRef } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";

export const BlurFade = forwardRef(({
    children,
    className,
    variant,
    duration = 0.4,
    delay = 0,
    offset = 6,
    direction = "down",
    inView = false,
    inViewMargin = "-50px",
    blur = "6px",
    ...props
}, externalRef) => {
    const internalRef = useRef(null);
    const ref = externalRef || internalRef;
    const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
    const isInView = !inView || inViewResult;

    const defaultVariants = {
        hidden: {
            [direction === "left" || direction === "right" ? "x" : "y"]:
                direction === "right" || direction === "down" ? -offset : offset,
            opacity: 0,
            filter: `blur(${blur})`,
        },
        visible: {
            [direction === "left" || direction === "right" ? "x" : "y"]: 0,
            opacity: 1,
            filter: `blur(0px)`,
        },
    };

    const combinedVariants = variant || defaultVariants;

    return (
        <AnimatePresence>
            <motion.div
                ref={ref}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                exit="hidden"
                variants={combinedVariants}
                transition={{
                    delay: 0.04 + delay,
                    duration,
                    ease: "easeOut",
                }}
                className={className}
                {...props}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
});

BlurFade.displayName = "BlurFade";
