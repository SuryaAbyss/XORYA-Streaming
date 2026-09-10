/**
 * Utility to determine if a movie or TV show is unreleased/upcoming,
 * and provide clean, cinematic labels.
 */
export const getReleaseInfo = (item) => {
    if (!item) return { isUnreleased: false, label: 'Play Now', shortLabel: 'Play', formattedDate: null };

    const dateStr = item.release_date || item.first_air_date;
    let isFuture = false;
    let formattedDate = null;
    let year = null;

    if (dateStr) {
        year = dateStr.slice(0, 4);
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (d > today) {
                isFuture = true;
                if (dateStr.length >= 10) {
                    formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                } else if (dateStr.length >= 4) {
                    formattedDate = year;
                }
            }
        }
    }

    const unreleasedStatuses = ['In Production', 'Post Production', 'Planned', 'Upcoming', 'Rumored'];
    const isUnreleasedStatus = Boolean(item.status && unreleasedStatuses.includes(item.status));

    const isUnreleased = isFuture || isUnreleasedStatus;

    let label = 'Play Now';
    let shortLabel = 'Play';

    if (isUnreleased) {
        if (formattedDate) {
            label = `Releasing ${formattedDate}`;
            shortLabel = `Releasing ${formattedDate}`;
        } else if (item.status === 'In Production') {
            label = 'In Production';
            shortLabel = 'In Production';
        } else if (item.status === 'Post Production') {
            label = 'Post-Production';
            shortLabel = 'Coming Soon';
        } else if (year && parseInt(year, 10) >= new Date().getFullYear()) {
            label = `Releasing ${year}`;
            shortLabel = `Releasing ${year}`;
        } else {
            label = 'Coming Soon';
            shortLabel = 'Coming Soon';
        }
    }

    return {
        isUnreleased,
        label,
        shortLabel,
        formattedDate,
        year
    };
};
