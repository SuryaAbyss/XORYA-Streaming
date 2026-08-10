"use client"

import type { ComponentProps } from "react"
import type { TargetAndTransition } from "motion/react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

const initialProps: TargetAndTransition = {
  pathLength: 0,
  opacity: 0,
}

const animateProps: TargetAndTransition = {
  pathLength: 1,
  opacity: 1,
}

export type AppleHelloEffectChineseProps = Omit<
  ComponentProps<typeof motion.svg>,
  "durationScale" | "onAnimationComplete"
> & {
  durationScale?: number
  onAnimationComplete?: () => void
}

export function AppleHelloEffectChinese({
  className,
  durationScale = 1,
  onAnimationComplete,
  ...props
}: AppleHelloEffectChineseProps) {
  const calc = (x: number) => x * durationScale

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
      {...props}
    >
      <title>你好</title>
      <g transform="scale(1, -1) translate(0, -731)">
        {/* ni 1 */}
        <motion.path
          d="M285,736 C216,605.6666259765625 147,475.33331298828125 78,345"
          initial={initialProps}
          animate={animateProps}
          transition={{
            duration: calc(0.6),
            ease: [0.22, 1, 0.36, 1],
            opacity: { duration: 0.2 },
          }}
        />
        {/* ni 2 */}
        <motion.path
          d="M211,584 C223,407 218,117 207,-2"
          initial={initialProps}
          animate={animateProps}
          transition={{
            duration: calc(0.6),
            ease: [0.22, 1, 0.36, 1],
            delay: calc(0.55),
            opacity: { duration: 0.2, delay: calc(0.55) },
          }}
        />
        {/* ni 3 */}
        <motion.path
          d="M567,779 C509.3333435058594,675.6666870117188 451.6666564941406,572.3333129882812 394,469"
          initial={initialProps}
          animate={animateProps}
          transition={{
            duration: calc(0.5),
            ease: [0.22, 1, 0.36, 1],
            delay: calc(1.1),
            opacity: { duration: 0.15, delay: calc(1.1) },
          }}
        />
        {/* ni 4 */}
        <motion.path
          d="M394,469 C475.9014892578125,571.8762817382812 590.74609375,651 728,651 C798,651 844,619 844,557 C844,503 811,455 762,425"
          initial={initialProps}
          animate={animateProps}
          transition={{
            duration: calc(0.8),
            ease: [0.22, 1, 0.36, 1],
            delay: calc(1.5),
            opacity: { duration: 0.25, delay: calc(1.5) },
          }}
        />
        {/* ni 5 */}
        <motion.path
          d="M595,436 C606,366 618,221 618,89 C618,-5 595,-46 534,-47 C456,-48 375.84490966796875,35.37379837036133 375.8900146484375,108.37449645996094 C375.91351318359375,146.375 391.9342956542969,180.03729248046875 432.9537048339844,211.17140197753906 C490.49969482421875,255.5749053955078 609,287 724,285 C828,283 877,240 877,171 C877,108 848,51 806,10"
          initial={initialProps}
          animate={animateProps}
          transition={{
            duration: calc(1.2),
            ease: [0.22, 1, 0.36, 1],
            delay: calc(2.2),
            opacity: { duration: 0.4, delay: calc(2.2) },
          }}
        />
        {/* hao 1 */}
        <motion.path
          d="M1370.3753662109375,761.638671875 C1281.281005859375,557.6024169921875 1228.8310546875,391.9953918457031 1228.8310546875,309.51910400390625 C1228.8310546875,206.37730407714844 1361.490478515625,40.56380081176758 1468.82421875,-15.850600242614746"
          initial={initialProps}
          animate={animateProps}
          transition={{
            duration: calc(0.9),
            ease: [0.22, 1, 0.36, 1],
            delay: calc(3.3),
            opacity: { duration: 0.3, delay: calc(3.3) },
          }}
        />
        {/* hao 2 */}
        <motion.path
          d="M1452.9091796875,541 C1431.9091796875,309 1365.9091796875,140 1307.9091796875,68 C1272.9091796875,24 1233.9091796875,3 1180.9091796875,4 C1111.9091796875,6 1042.9091796875,79 1035.9091796875,185 C1031.9091796875,245 1047.9091796875,299 1075.9091796875,345 C1161.9091796875,487 1370.9091796875,562 1517.9091796875,562"
          initial={initialProps}
          animate={animateProps}
          transition={{
            duration: calc(1.0),
            ease: [0.22, 1, 0.36, 1],
            delay: calc(4.1),
            opacity: { duration: 0.35, delay: calc(4.1) },
          }}
        />
        {/* hao 3 */}
        <motion.path
          d="M1609.9091796875,707 C1639.6414794921875,743.9091186523438 1684.9091796875,772 1744.9091796875,770 C1800.9091796875,768 1834.9091796875,738 1836.9091796875,688 C1839.9090576171875,620.0031127929688 1781.781005859375,559.9359130859375 1669.9091796875,504"
          initial={initialProps}
          animate={animateProps}
          transition={{
            duration: calc(0.8),
            ease: [0.22, 1, 0.36, 1],
            delay: calc(5.0),
            opacity: { duration: 0.25, delay: calc(5.0) },
          }}
        />
        {/* hao 4 */}
        <motion.path
          d="M1669.9091796875,504 C1746.843017578125,444.8200988769531 1799.8367919921875,343.0945129394531 1808.9091796875,206 C1819.9091796875,44 1777.9091796875,-38 1705.9091796875,-38 C1623.9091796875,-38 1533.9091796875,84 1529.9091796875,192 C1527.9091796875,250 1548.9722900390625,288.031494140625 1604.9091796875,316 C1689.9091796875,359 1866.9091796875,354 1993.9091796875,307"
          initial={initialProps}
          animate={animateProps}
          transition={{
            duration: calc(1.1),
            ease: [0.22, 1, 0.36, 1],
            delay: calc(5.7),
            opacity: { duration: 0.35, delay: calc(5.7) },
          }}
          onAnimationComplete={onAnimationComplete}
        />
      </g>
    </motion.svg>
  )
}
