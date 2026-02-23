import React, { useEffect, useMemo, useState } from "react"
import { cn } from "../lib/utils"

const DEFAULT_GRIDS = {
    "6x4": { rows: 4, cols: 6 },
    "8x8": { rows: 8, cols: 8 },
    "8x3": { rows: 3, cols: 8 },
    "4x6": { rows: 6, cols: 4 },
    "3x8": { rows: 8, cols: 3 },
    "12x12": { rows: 12, cols: 12 },
}

export const PixelImage = ({
    src,
    grid = "6x4",
    grayscaleAnimation = true,
    pixelFadeInDuration = 1000,
    maxAnimationDelay = 1200,
    colorRevealDelay = 1300,
    customGrid,
    className,
    imageClassName,
    style,
}) => {
    const [isVisible, setIsVisible] = useState(false)
    const [showColor, setShowColor] = useState(false)

    const MIN_GRID = 1
    const MAX_GRID = 32

    const { rows, cols } = useMemo(() => {
        const isValidGrid = (grid) => {
            if (!grid) return false
            const { rows, cols } = grid
            return (
                Number.isInteger(rows) &&
                Number.isInteger(cols) &&
                rows >= MIN_GRID &&
                cols >= MIN_GRID &&
                rows <= MAX_GRID &&
                cols <= MAX_GRID
            )
        }

        return isValidGrid(customGrid) ? customGrid : DEFAULT_GRIDS[grid]
    }, [customGrid, grid])

    useEffect(() => {
        setIsVisible(true)
        const colorTimeout = setTimeout(() => {
            setShowColor(true)
        }, colorRevealDelay)
        return () => clearTimeout(colorTimeout)
    }, [colorRevealDelay])

    const pieces = useMemo(() => {
        const total = rows * cols
        return Array.from({ length: total }, (_, index) => {
            const row = Math.floor(index / cols)
            const col = index % cols

            const clipPath = `polygon(
        ${col * (100 / cols)}% ${row * (100 / rows)}%,
        ${(col + 1) * (100 / cols)}% ${row * (100 / rows)}%,
        ${(col + 1) * (100 / cols)}% ${(row + 1) * (100 / rows)}%,
        ${col * (100 / cols)}% ${(row + 1) * (100 / rows)}%
      )`

            const delay = Math.random() * maxAnimationDelay
            return {
                clipPath,
                delay,
            }
        })
    }, [rows, cols, maxAnimationDelay])

    return (
        <div
            className={cn("select-none", className)}
            style={{ position: "relative", width: "100%", height: "100%", ...style }}
        >
            {pieces.map((piece, index) => (
                <div
                    key={index}
                    className={cn(
                        className
                    )}
                    style={{
                        position: "absolute",
                        top: 0, right: 0, bottom: 0, left: 0,
                        opacity: isVisible ? 1 : 0,
                        clipPath: piece.clipPath,
                        transitionProperty: "opacity",
                        transitionTimingFunction: "ease-out",
                        transitionDelay: `${piece.delay}ms`,
                        transitionDuration: `${pixelFadeInDuration}ms`,
                    }}
                >
                    <img
                        src={src}
                        alt={`Pixel image piece ${index + 1}`}
                        className={cn(
                            "z-0", // changed from z-1 to z-0 which is more standard or just remove it
                            imageClassName
                        )}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: grayscaleAnimation && !showColor ? "grayscale(100%)" : "grayscale(0%)",

                            transition: grayscaleAnimation
                                ? `filter ${pixelFadeInDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
                                : "none",
                        }}
                        draggable={false}
                    />
                </div>
            ))}
        </div>
    )
}

export default PixelImage;
