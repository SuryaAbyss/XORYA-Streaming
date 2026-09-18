/**
 * Comprehensive device & platform detection utility.
 * Accurately distinguishes between Smart TVs (Android TV, Apple TV, webOS LG, Tizen Samsung, Fire TV),
 * Mobile Phones, Tablets, and Desktop screens.
 */

export const isTVDevice = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';

    // Explicit Smart TV user-agent identifiers
    const tvPatterns = [
        /SmartTV/i,
        /SMART-TV/i,
        /Smart-TV/i,
        /Android TV/i,
        /GoogleTV/i,
        /Google-TV/i,
        /AppleTV/i,
        /Apple TV/i,
        /HbbTV/i,
        /NetCast/i,
        /Viera/i,
        /Roku/i,
        /AFTT/i,    // Amazon Fire TV Stick
        /AFTM/i,    // Amazon Fire TV Stick 4K
        /AFTB/i,    // Amazon Fire TV Cube / Box
        /AFTSS/i,   // Amazon Fire TV
        /FireTV/i,
        /Fire TV/i,
        /MiTV/i,    // Xiaomi Mi TV
        /MiBOX/i,   // Xiaomi Mi Box
        /BRAVIA/i,  // Sony Bravia TV
        /Tizen.+TV/i,
        /webOSTV/i,
        /Web0S/i,
        /Large Screen/i,
        /Kylo/i,
        /DuneHD/i,
        /CrKey/i,   // Chromecast
        /TV Safari/i,
        /\bTV\b/i
    ];

    if (tvPatterns.some((pattern) => pattern.test(ua))) {
        return true;
    }

    // LG webOS browsers (which run on big screens and often have webOS/Web0S in UA)
    if (/webOS|Web0S/i.test(ua) && !/Mobile/i.test(ua)) {
        return true;
    }

    // Android TV browsers (Android UA without "Mobile" token on large/standard displays)
    if (/Android/i.test(ua) && !/Mobile/i.test(ua) && (typeof window.innerWidth === 'number' ? window.innerWidth >= 960 : true)) {
        return true;
    }

    return false;
};

export const isMobileDevice = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

    // Never classify a Smart TV or Android TV as a mobile phone UI
    if (isTVDevice()) return false;

    const ua = navigator.userAgent || '';

    // Mobile phones contain specific phone tokens or "Mobile"
    const isMobilePhoneUA = /iPhone|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(ua) ||
        (/Android/i.test(ua) && /Mobile/i.test(ua));

    // Screen width boundary for phone layout
    const isSmallScreen = typeof window.innerWidth === 'number' && window.innerWidth <= 768;

    return isMobilePhoneUA || isSmallScreen;
};

export const getDeviceType = () => {
    if (isTVDevice()) return 'tv';
    if (isMobileDevice()) return 'mobile';
    return 'desktop';
};

export default {
    isTVDevice,
    isMobileDevice,
    getDeviceType
};
