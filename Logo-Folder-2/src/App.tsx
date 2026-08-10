import { useState, useRef, useEffect, useCallback } from "react"
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react"
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react"

import { AppleHelloEffectEnglish } from "@/components/apple-hello-effect-english"
import { AppleHelloEffectHindi } from "@/components/apple-hello-effect-hindi"
import { AppleHelloEffectSpanish } from "@/components/apple-hello-effect-spanish"
import { AppleHelloEffectVietnamese } from "@/components/apple-hello-effect-vietnamese"
import { AppleHelloEffectFrench } from "@/components/apple-hello-effect-french"
import { AppleHelloEffectJapanese } from "@/components/apple-hello-effect-japanese"
import { AppleHelloEffectChinese } from "@/components/apple-hello-effect-chinese"

import { LiquidGlassViewport, LiquidGlassButton } from "@/components/ui/apple-tahoe-liquid-glass-button"
import XoraLogoIntro from "@/components/xora-logo-intro"

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-4 w-4 fill-black/80 text-black/80"
    {...props}
  >
    <path d="M8 5v14l11-7z" />
  </svg>
)

export default function App() {
  const [index, setIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isAnimatingLogo, setIsAnimatingLogo] = useState(false)
  const [hasHovered, setHasHovered] = useState(false)
  const isUnlockedRef = useRef(isUnlocked)

  const handleLogoIntroComplete = useCallback(() => {
    setIsUnlocked(true)
    setIsAnimatingLogo(false)
  }, [])

  // Mouse position tracking for liquid glass button
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)

  // Spring configuration for cursor follow delay
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 }
  const smoothX = useSpring(cursorX, springConfig)
  const smoothY = useSpring(cursorY, springConfig)

  const containerRef = useRef<HTMLDivElement>(null)
  const buttonWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    isUnlockedRef.current = isUnlocked
  }, [isUnlocked])

  const handleFirstHover = () => {
    if (hasHovered) return
    if (buttonWrapperRef.current && containerRef.current) {
      const buttonRect = buttonWrapperRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      const localX = buttonRect.left - containerRect.left
      const localY = buttonRect.top - containerRect.top

      cursorX.set(localX)
      cursorY.set(localY)
      setHasHovered(true)
    }
  }

  useEffect(() => {
    if (isUnlocked || !hasHovered) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonWrapperRef.current || !containerRef.current || isUnlockedRef.current) return
      const buttonRect = buttonWrapperRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      cursorX.set(e.clientX - containerRect.left - buttonRect.width / 2)
      cursorY.set(e.clientY - containerRect.top - buttonRect.height / 2)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [cursorX, cursorY, isUnlocked, hasHovered])

  const handleAnimationEnd = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setIndex((prevIndex) => (prevIndex + 1) % 7)
      setIsTransitioning(false)
    }, 1800) // 1.8 second premium pause after writing finishes
  }

  // Curated premium Shader Gradient configurations matching each language
  const shaderProps = [
    // 0: English - Mandarin (orange / deep red - vibrant warm) - Swapped with Chinese
    {
      type: "waterPlane" as const,
      animate: "on" as const,
      brightness: 1.2,
      cAzimuthAngle: 180,
      cDistance: 2.4,
      cPolarAngle: 95,
      cameraZoom: 1,
      color1: "#ff6a1a",
      color2: "#c73c00",
      color3: "#FD4912",
      envPreset: "city" as const,
      grain: "off" as const,
      lightType: "3d" as const,
      positionX: 0,
      positionY: -2.1,
      positionZ: 0,
      reflection: 0.1,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 225,
      uAmplitude: 0,
      uDensity: 1.8,
      uFrequency: 5.5,
      uSpeed: 0.2,
      uStrength: 3,
    },
    // 1: Hindi - Pensive (blue / purple - rich dark)
    {
      type: "sphere" as const,
      animate: "on" as const,
      brightness: 1.5,
      cAzimuthAngle: 250,
      cDistance: 1.5,
      cPolarAngle: 140,
      cameraZoom: 12.5,
      color1: "#809bd6",
      color2: "#910aff",
      color3: "#af38ff",
      envPreset: "city" as const,
      grain: "on" as const,
      lightType: "3d" as const,
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      reflection: 0.5,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 140,
      uAmplitude: 7,
      uDensity: 0.8,
      uFrequency: 5.5,
      uSpeed: 0.3,
      uStrength: 0.4,
    },
    // 2: Spanish - Mint (mint / cyan / white - very bright)
    {
      type: "waterPlane" as const,
      animate: "on" as const,
      brightness: 1.2,
      cAzimuthAngle: 170,
      cDistance: 4.4,
      cPolarAngle: 70,
      cameraZoom: 1,
      color1: "#94ffd1",
      color2: "#6bf5ff",
      color3: "#ffffff",
      envPreset: "city" as const,
      grain: "off" as const,
      lightType: "3d" as const,
      positionX: 0,
      positionY: 0.9,
      positionZ: -0.3,
      reflection: 0.1,
      rotationX: 45,
      rotationY: 0,
      rotationZ: 0,
      uAmplitude: 0,
      uDensity: 1.2,
      uFrequency: 0,
      uSpeed: 0.2,
      uStrength: 3.4,
    },
    // 3: Vietnamese - Interstella (teal / orange / lavender - medium/dark)
    {
      type: "sphere" as const,
      animate: "on" as const,
      brightness: 0.8,
      cAzimuthAngle: 270,
      cDistance: 0.5,
      cPolarAngle: 180,
      cameraZoom: 15.1,
      color1: "#73bfc4",
      color2: "#ff810a",
      color3: "#8da0ce",
      envPreset: "city" as const,
      grain: "on" as const,
      lightType: "env" as const,
      positionX: -0.1,
      positionY: 0,
      positionZ: 0,
      reflection: 0.4,
      rotationX: 0,
      rotationY: 130,
      rotationZ: 70,
      uAmplitude: 3.2,
      uDensity: 0.8,
      uFrequency: 5.5,
      uSpeed: 0.3,
      uStrength: 0.3,
    },
    // 4: French - Nighty Night (slate / lavender / dark - dark)
    {
      type: "waterPlane" as const,
      animate: "on" as const,
      brightness: 1,
      cAzimuthAngle: 180,
      cDistance: 2.8,
      cPolarAngle: 80,
      cameraZoom: 9.1,
      color1: "#606080",
      color2: "#8d7dca",
      color3: "#212121",
      envPreset: "city" as const,
      grain: "on" as const,
      lightType: "3d" as const,
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      reflection: 0.1,
      rotationX: 50,
      rotationY: 0,
      rotationZ: -60,
      uAmplitude: 0,
      uDensity: 1.5,
      uFrequency: 0,
      uSpeed: 0.3,
      uStrength: 1.5,
    },
    // 5: Japanese - VIOLA (bright white / yellow / blue sphere)
    {
      type: "sphere" as const,
      animate: "on" as const,
      brightness: 1.1,
      cAzimuthAngle: 0,
      cDistance: 7.1,
      cPolarAngle: 140,
      cameraZoom: 17.3,
      color1: "#ffffff",
      color2: "#ffbb00",
      color3: "#0700ff",
      envPreset: "city" as const,
      grain: "off" as const,
      lightType: "3d" as const,
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      reflection: 0.1,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      uAmplitude: 1.4,
      uDensity: 1.1,
      uFrequency: 5.5,
      uSpeed: 0.1,
      uStrength: 1,
    },
    // 6: Chinese - SUNSET (orange / blue / gold sphere)
    {
      type: "sphere" as const,
      animate: "on" as const,
      brightness: 1.5,
      cAzimuthAngle: 60,
      cDistance: 7.1,
      cPolarAngle: 90,
      cameraZoom: 15.3,
      color1: "#ff7a33",
      color2: "#33a0ff",
      color3: "#ffc53d",
      envPreset: "dawn" as const,
      grain: "off" as const,
      lightType: "3d" as const,
      positionX: 0,
      positionY: -0.15,
      positionZ: 0,
      reflection: 0.1,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      uAmplitude: 1.4,
      uDensity: 1.1,
      uFrequency: 5.5,
      uSpeed: 0.1,
      uStrength: 0.4,
    },
  ]

  // Contrast-aware text color themes matching each shader gradient
  const textThemes = [
    "text-amber-100",  // English (Mandarin - rich red/orange background)
    "text-zinc-50",    // Hindi (Pensive - dark background)
    "text-teal-950",   // Spanish (Mint - very bright background)
    "text-zinc-50",    // Vietnamese (Interstella - medium/dark background)
    "text-indigo-100", // French (Nighty Night - dark background)
    "text-indigo-950", // Japanese (VIOLA - white/yellow/blue bright sphere)
    "text-amber-100",  // Chinese (SUNSET - dark background with orange/gold sun sphere)
  ]

  // Scale for smooth Apple-style handwriting flow
  const fastScale = 0.45
  const initialEnglishScale = 0.95

  const demos = [
    <AppleHelloEffectEnglish
      key="english"
      durationScale={initialEnglishScale}
      className="w-full max-w-[280px] sm:max-w-[480px] md:max-w-[600px] h-auto"
      onAnimationComplete={handleAnimationEnd}
    />,
    <AppleHelloEffectHindi
      key="hindi"
      durationScale={fastScale}
      className="w-full max-w-[280px] sm:max-w-[480px] md:max-w-[600px] h-auto"
      onAnimationComplete={handleAnimationEnd}
    />,
    <AppleHelloEffectSpanish
      key="spanish"
      durationScale={fastScale}
      className="w-full max-w-[280px] sm:max-w-[480px] md:max-w-[600px] h-auto"
      onAnimationComplete={handleAnimationEnd}
    />,
    <AppleHelloEffectVietnamese
      key="vietnamese"
      durationScale={fastScale}
      className="w-full max-w-[340px] sm:max-w-[550px] md:max-w-[750px] h-auto"
      onAnimationComplete={handleAnimationEnd}
    />,
    <AppleHelloEffectFrench
      key="french"
      durationScale={fastScale}
      className="w-full max-w-[340px] sm:max-w-[550px] md:max-w-[750px] h-auto"
      onAnimationComplete={handleAnimationEnd}
    />,
    <AppleHelloEffectJapanese
      key="japanese"
      durationScale={fastScale}
      className="w-full max-w-[340px] sm:max-w-[550px] md:max-w-[750px] h-auto"
      onAnimationComplete={handleAnimationEnd}
    />,
    <AppleHelloEffectChinese
      key="chinese"
      durationScale={fastScale}
      className="w-full max-w-[340px] sm:max-w-[550px] md:max-w-[750px] h-auto"
      onAnimationComplete={handleAnimationEnd}
    />,
  ]

  return (
    <>
      {/* XORAYA logo intro — rendered on top (z-50), fades in while Apple hello fades out */}
      <AnimatePresence>
        {isAnimatingLogo && (
          <motion.div
            key="xoraya-intro-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50"
          >
            <XoraLogoIntro onComplete={handleLogoIntroComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="sync">
        {!isUnlocked ? (
          <motion.div
            key="intro-screen"
            ref={containerRef}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative min-h-screen w-screen overflow-hidden bg-black select-none"
          >
            {/* Black curtain fades away over 1.5s — pure opacity, no artifacts */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 z-30 bg-black pointer-events-none"
            />

            {/* Content wrapper: starts slightly blurred (camera-lens focus effect),
                sharpens to 0 as the black curtain lifts — synced to the same duration */}
            <motion.div
              initial={{ filter: "blur(6px)" }}
              animate={{ filter: "blur(0px)" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 z-0"
            >
            {/* Liquid Glass Viewport covering full screen */}
            <LiquidGlassViewport
              className="w-full h-full border-none rounded-none absolute inset-0 z-0"
            >
              {/* Background Shader Gradient Canvas */}
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

              {/* Handwriting slide elements in the center */}
              <div className={`relative z-10 flex min-h-screen flex-col items-center justify-center p-6 transition-colors duration-1000 ${textThemes[index]} pointer-events-none`}>
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

                    {/* Space for the button in the middle flow */}
                    <div className="h-[10px] mt-0 mb-16 flex items-center justify-center pointer-events-auto">
                      {!hasHovered && (
                        <motion.div
                          ref={buttonWrapperRef}
                          onMouseEnter={handleFirstHover}
                        >
                          <LiquidGlassButton showWaves={true} onClick={() => setIsAnimatingLogo(true)}>
                            <span>Explore</span>
                            <PlayIcon className="h-4 w-4 fill-black/80 text-black/80" />
                          </LiquidGlassButton>
                        </motion.div>
                      )}
                    </div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      transition={{ delay: 0.2 }}
                      className="text-xs tracking-[0.3em] uppercase font-medium select-none"
                    >
                      {index === 0 && "English"}
                      {index === 1 && "Hindi"}
                      {index === 2 && "Spanish"}
                      {index === 3 && "Vietnamese"}
                      {index === 4 && "French"}
                      {index === 5 && "Japanese"}
                      {index === 6 && "Chinese"}
                    </motion.p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Floating Glass Button (follows cursor only after first hover) */}
              {hasHovered && (
                <motion.div
                  ref={buttonWrapperRef}
                  className="absolute left-0 top-0 z-20 pointer-events-auto"
                  style={{
                    x: smoothX,
                    y: smoothY,
                  }}
                >
                  <LiquidGlassButton onClick={() => setIsAnimatingLogo(true)}>
                    <span>Explore</span>
                    <PlayIcon className="h-4 w-4 fill-black/80 text-black/80" />
                  </LiquidGlassButton>
                </motion.div>
              )}
            </LiquidGlassViewport>
            </motion.div>{/* end blur content wrapper */}
          </motion.div>
        ) : (
          <motion.div
            key="main-website-blank"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative min-h-screen w-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden font-sans"
          >
            {/* Subtle glowing lights in the background of main site */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Logo fade-in */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center text-center p-6 z-10"
            >
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-[0.5em] uppercase bg-gradient-to-r from-red-500 via-amber-500 to-rose-600 bg-clip-text text-transparent select-none drop-shadow-2xl">
                XORA
              </h1>
              <p className="mt-6 text-sm tracking-[0.2em] font-medium text-white/40 uppercase">
                Main Website Coming Soon
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
