import React, { useId } from "react";
import { cn } from "../../utils/cn";

export function StripedPattern({
    className,
    width = 40,
    height = 40,
    x = -1,
    y = -1,
    direction = "left",
    ...props
}) {
    const id = useId();

    return (
        <svg
            aria-hidden="true"
            className={cn(
                "pointer-events-none absolute inset-0 h-full w-full stroke-neutral-400/50 dark:stroke-neutral-500/50",
                className
            )}
            {...props}
        >
            <defs>
                <pattern
                    id={id}
                    width={width}
                    height={height}
                    patternUnits="userSpaceOnUse"
                    x={x}
                    y={y}
                >
                    {direction === "left" && (
                        <path
                            d={`M0 ${height}L${width} 0`}
                            stroke="currentColor"
                            strokeWidth="1"
                        />
                    )}
                    {direction === "right" && (
                        <path
                            d={`M0 0L${width} ${height}`}
                            stroke="currentColor"
                            strokeWidth="1"
                        />
                    )}
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${id})`} />
        </svg>
    );
}
