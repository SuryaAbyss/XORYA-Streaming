import { useEffect, useRef, useState } from 'react';

/**
 * useLazySection
 *
 * Returns a ref to attach to a section container and a boolean `isVisible`.
 * When the element comes within `rootMargin` of the viewport, `isVisible` flips
 * to true and stays true (one-shot — never goes back to false).
 *
 * Usage:
 *   const { ref, isVisible } = useLazySection();
 *   return <div ref={ref}>{isVisible ? <ActualContent /> : <Skeleton />}</div>
 *
 * @param {string} rootMargin - how far before the element enters viewport to trigger (default '200px')
 */
export function useLazySection(rootMargin = '200px 0px') {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Already visible — nothing to do
        if (isVisible) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // one-shot: stop observing once triggered
                }
            },
            { rootMargin, threshold: 0 }
        );

        observer.observe(el);

        return () => observer.disconnect();
    }, [rootMargin, isVisible]);

    return { ref, isVisible };
}

export default useLazySection;
