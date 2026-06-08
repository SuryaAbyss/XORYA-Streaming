import React, { useEffect } from 'react';

const SEO = ({ 
    title = 'XORYA - Premium Streaming Platform', 
    description = 'Watch movies and TV shows on XORYA. Experience premium streaming with an interactive interface, personalized recommendations, and high-quality playback.', 
    image = '/logo.png', 
    url = window.location.href, 
    type = 'website',
    schema = null
}) => {
    useEffect(() => {
        // Update title
        document.title = title;

        // Helper to update or create meta tags
        const setMetaTag = (selector, attribute, value, attrName) => {
            let element = document.querySelector(selector);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, attrName);
                document.head.appendChild(element);
            }
            element.setAttribute('content', value);
        };

        // Standard Meta
        setMetaTag('meta[name="description"]', 'name', description, 'description');
        
        // Canonical Link
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', url);

        // Open Graph Meta
        setMetaTag('meta[property="og:title"]', 'property', title, 'og:title');
        setMetaTag('meta[property="og:description"]', 'property', description, 'og:description');
        setMetaTag('meta[property="og:image"]', 'property', image, 'og:image');
        setMetaTag('meta[property="og:url"]', 'property', url, 'og:url');
        setMetaTag('meta[property="og:type"]', 'property', type, 'og:type');

        // Twitter Meta
        setMetaTag('meta[name="twitter:card"]', 'name', 'summary_large_image', 'twitter:card');
        setMetaTag('meta[name="twitter:title"]', 'name', title, 'twitter:title');
        setMetaTag('meta[name="twitter:description"]', 'name', description, 'twitter:description');
        setMetaTag('meta[name="twitter:image"]', 'name', image, 'twitter:image');

        // JSON-LD Schema
        let script = document.querySelector('#json-ld-schema');
        if (schema) {
            if (!script) {
                script = document.createElement('script');
                script.setAttribute('id', 'json-ld-schema');
                script.setAttribute('type', 'application/ld+json');
                document.head.appendChild(script);
            }
            script.textContent = JSON.stringify(schema);
        } else if (script) {
            script.remove();
        }

        return () => {
            // Optional: cleanup or reset to defaults when component unmounts
        };
    }, [title, description, image, url, type, schema]);

    return null;
};

export default SEO;
