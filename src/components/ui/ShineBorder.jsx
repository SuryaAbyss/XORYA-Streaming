import React from "react";
import { cn } from "../../lib/utils";

/**
 * Shine Border
 *
 * An animated background border effect component with configurable properties.
 */
export function ShineBorder({
    borderWidth = 1,
    duration = 14,
    shineColor = "#000000",
    className,
    style,
    ...props
}) {
    return (
        <div
            style={{
                "--border-width": `${borderWidth}px`,
                "--duration": `${duration}s`,
                backgroundImage: `radial-gradient(transparent,transparent, ${Array.isArray(shineColor) ? shineColor.join(",") : shineColor
                    },transparent,transparent)`,
                backgroundSize: "300% 300%",
                mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: `${borderWidth}px`,
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                borderRadius: 'inherit',
                pointerEvents: 'none',
                willChange: 'background-position',
                ...style,
            }}
            className={cn(
                "shine-border-animation",
                className
            )}
            {...props}
        />
    );
}
