/**
 * Main JavaScript file for hero interactions and deferred analytics
 * This script uses inline-sync pattern for immediate hero interactions
 * and deferred loading for analytics scripts
 */

(function() {
    'use strict';

    // INLINE-SYNC SCRIPT: Immediate hero interaction setup
    const HeroInteraction = {
        init: function() {
            if (typeof window === 'undefined') return;

            this.setupHeroParallax();
            this.setupHeroCTA();
            this.setupResponsiveImages();
        },

        setupHeroParallax: function() {
            const heroSection = document.querySelector('.hero-section');
            const heroContent = document.querySelector('.hero-content');

            if (!heroSection || !heroContent) return;

            let ticking = false;
            let scrollY = 0;

            const updateParallax = () => {
                scrollY = window.pageYOffset;

                if (!ticking) {
                    requestAnimationFrame(() => {
                        const speed = 0.5;
                        const yPos = -(scrollY * speed);

                        heroSection.style.transform = `translateY(${yPos}px)`;
                        if (heroContent) {
                            heroContent.style.transform = `translateY(${-yPos * 0.3}px)`;
                        }

                        ticking = false;
                    });
                    ticking = true;
                }
            };

            window.addEventListener('scroll', updateParallax, { passive: true });
        },

        setupHeroCTA: function() {
            const ctas = document.querySelectorAll('.hero-cta');

            ctas.forEach(cta => {
                cta.addEventListener('click', function(e) {
                    e.preventDefault();

                    // Add ripple effect
                    const ripple = document.createElement('span');
                    ripple.className = 'ripple';
                    this.appendChild(ripple);

                    setTimeout(() => ripple.remove(), 600);

                    // Animate scroll to target
                    const target = this.getAttribute('href');
                    const targetEl = document.querySelector(target || '#content');

                    if (targetEl) {
                        targetEl.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        },

        setupResponsiveImages: function() {
            const pictureElements = document.querySelectorAll('picture.hero-image');

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target.querySelector('img');
                        if (img && img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                        }
                    }
                });
            }, {
                rootMargin: '50px'
            });

            pictureElements.forEach(pic => observer.observe(pic));
        }
    };

    // Initialize hero interaction immediately (sync)
    HeroInteraction.init();

    // DEFERRED ANALYTICS: Load after page is interactive
    const Analytics = {
        trackingId: null,
        initialized: false,

        init: function(trackingId) {
            if (this.initialized || typeof window === 'undefined') return;

            this.trackingId = trackingId || 'GA_MEASUREMENT_ID';
            this.initialized = true;

            // Set up observers for performance metrics
            this.setupAnalytics();
            this.setupPerformanceObserver();
            this.setupInteractionTracking();
        },

        setupAnalytics: function() {
            // Defer Google Analytics
            const gaScript = document.createElement('script');
            gaScript.async = true;
            gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`;

            // Insert after page load
            window.addEventListener('load', () => {
                document.head.appendChild(gaScript);

                // Initialize GA
                window.dataLayer = window.dataLayer || [];
                function gtag() { dataLayer.push(arguments); }
                gtag('js', new Date());
                gtag('config', this.trackingId);
            });
        },

        setupPerformanceObserver: function() {
            if (!('PerformanceObserver' in window)) return;

            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();

                entries.forEach((entry) => {
                    // Track hero image load time
                    if (entry.initiatorType === 'img' &&
                        entry.name.includes('hero-image')) {
                        this.sendEvent('hero_performance', {
                            load_time: Math.round(entry.loadDuration)
                        });
                    }
                });
            });

            observer.observe({ entryTypes: ['resource'] });
        },

        setupInteractionTracking: function() {
            // Track hero CTA clicks
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('hero-cta')) {
                    this.sendEvent('hero_cta_click', {
                        href: e.target.getAttribute('href'),
                        text: e.target.textContent.trim()
                    });
                }
            });

            // Track scroll depth past hero
            let maxScroll = 0;
            const trackScroll = () => {
                const scrollPercentage = Math.round(
                    (window.pageYOffset + window.innerHeight) /
                    document.documentElement.scrollHeight * 100
                );

                if (scrollPercentage > maxScroll) {
                    maxScroll = scrollPercentage;
                    this.sendEvent('scroll_depth', { depth: maxScroll });
                }
            };

            window.addEventListener('scroll',
                this.throttle(trackScroll, 1000),
                { passive: true }
            );
        },

        sendEvent: function(eventName, parameters) {
            if (!this.initialized) return;

            // Send to GA4
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, parameters);
            }

            // Fallback console log for debugging
            if (window.location.hostname === 'localhost') {
                console.log('[Analytics]', eventName, parameters);
            }
        },

        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    };

    // Initialize deferred analytics after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            Analytics.init('YOUR_GA_MEASUREMENT_ID');
        });
    } else {
        // DOM already loaded
        Analytics.init('YOUR_GA_MEASUREMENT_ID');
    }

    // Export for global access
    window.HeroInteraction = HeroInteraction;
    window.Analytics = Analytics;

})();
