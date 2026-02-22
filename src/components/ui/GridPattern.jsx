import { useId } from "react";

export function GridPattern({
    width = 40,
    height = 40,
    x = -1,
    y = -1,
    strokeDasharray = "0",
    squares,
    className,
    style,
    ...props
}) {
    const id = useId();

    return (
        <svg
            aria-hidden="true"
            className={className}
            style={{
                pointerEvents: "none",
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                fill: "rgba(156, 163, 175, 0.3)", // gray-400/30
                stroke: "rgba(156, 163, 175, 0.3)", // gray-400/30
                ...style,
            }}
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
                    <path
                        d={`M.5 ${height}V.5H${width}`}
                        fill="none"
                        strokeDasharray={strokeDasharray}
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
            {squares && (
                <svg x={x} y={y} style={{ overflow: "visible" }}>
                    {squares.map(([x, y]) => (
                        <rect
                            strokeWidth="0"
                            key={`${x}-${y}`}
                            width={width - 1}
                            height={height - 1}
                            x={x * width + 1}
                            y={y * height + 1}
                        />
                    ))}
                </svg>
            )}
        </svg>
    );
}

export default GridPattern;
