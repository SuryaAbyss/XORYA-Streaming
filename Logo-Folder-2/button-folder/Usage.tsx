"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { LiquidGlassViewport, LiquidGlassButton } from "@/components/ui/apple-tahoe-liquid-glass-button";
import { Sparkles } from "lucide-react";

const ZapIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

export default function GlassButtonDemo() {
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonWrapperRef = useRef<HTMLDivElement>(null);
    const [bgKey, setBgKey] = useState(0);

    // Scene array containing the original high-contrast futuristic landscape image as the default [bgKey = 0]
    const backgroundImages = [
        "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/f0733c36-a64b-4f7c-b06c-3c679f8ddbc1_3840w.webp", // Original Apple Tahoe Scene
        "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/ac5ddc71-c7e9-4c7d-8cf1-f31081856db9_3840w.webp", // Original Aave Labs Glass Scene
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1920&q=80",
    ];

    // Framer motion values for position tracking
    const cursorX = useMotionValue(0);
    const cursorY = useMotionValue(0);

    // Dynamic spring delay applied to mouse cursor tracking
    const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
    const smoothX = useSpring(cursorX, springConfig);
    const smoothY = useSpring(cursorY, springConfig);

    useEffect(() => {
        // Center the button relative to the viewport container bounds initially
        if (containerRef.current && buttonWrapperRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const buttonRect = buttonWrapperRef.current.getBoundingClientRect();

            cursorX.set(containerRect.width / 2 - buttonRect.width / 2);
            cursorY.set(containerRect.height / 2 - buttonRect.height / 2);
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!buttonWrapperRef.current || !containerRef.current) return;
            const buttonRect = buttonWrapperRef.current.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();

            cursorX.set(e.clientX - containerRect.left - buttonRect.width / 2);
            cursorY.set(e.clientY - containerRect.top - buttonRect.height / 2);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [cursorX, cursorY]);

    const handleBgChange = () => {
        setBgKey((prev) => (prev + 1) % backgroundImages.length);
    };

    return (
        <div
            ref={containerRef}
            className="relative flex h-screen w-screen overflow-hidden bg-black select-none"
        >
            {/* Full-screen refraction container */}
            <LiquidGlassViewport
                key={bgKey}
                bgImage={backgroundImages[bgKey]}
                fallbackMode="webgl"
                className="w-full h-full border-none rounded-none"
            >
                {/* Floating cursor wrapper */}
                <motion.div
                    ref={buttonWrapperRef}
                    className="absolute left-0 top-0 z-10 pointer-events-auto"
                    style={{
                        x: smoothX,
                        y: smoothY,
                    }}
                >
                    {/* Glass button with label and SVG icon side-by-side */}
                    <LiquidGlassButton>
                        <span>Generate</span>
                        <ZapIcon className="h-5 w-5 fill-black/10 text-black/85" />
                    </LiquidGlassButton>
                </motion.div>
            </LiquidGlassViewport>

            {/* Floating Change Scene control button at bottom-right */}
            <button
                onClick={handleBgChange}
                className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 text-xs font-semibold px-5 py-3 rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md hover:bg-black/80 hover:border-white/20 hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-black/60 cursor-pointer"
                title="Cycle Backdrop Image"
            >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Change Scene</span>
            </button>
        </div>
    );
}