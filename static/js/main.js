// static/js/main.js - Hero Interaction and Deferred Analytics Implementation
(function() {
    'use strict';

    // Configuration - use data attributes from HTML for flexibility
    const CONFIG = {
        heroSelector: '[data-hero]',
        animationDelay: 300,
        analyticsEndpoint: '/api/analytics',
        debug: false
    };

    // Logging utility for debugging
    const log = CONFIG.debug ? console.log.bind(console) : () => {};

    // Hero Interaction Module - inline-sync pattern
    const HeroInteraction = {
        elements: {
            hero: null,
            ctaButtons: [],
            scrollIndicators: []
        },

        init() {
            log('Initializing hero interaction...');
            this.cacheElements();
            this.bindEvents();
            this.preloadImages();
        },

        cacheElements() {
            this.elements.hero = document.querySelector(CONFIG.heroSelector);
            if (!this.elements.hero) {
                console.warn('[HeroInteraction] No hero element found');
                return false;
            }

            this.elements.ctaButtons = this.elements.hero.querySelectorAll('[data-cta]');
            this.elements.scrollIndicators = this.elements.hero.querySelectorAll('[data-scroll-indicator]');

            return true;
        },

        bindEvents() {
            if (!this.elements.hero) return;

            // CTA button interactions
            this.elements.ctaButtons.forEach(button => {
                button.addEventListener('click', this.handleCTAClick.bind(this));
                button.addEventListener('mouseenter', this.handleCTAHover.bind(this));
                button.addEventListener('mouseleave', this.handleCTAUnhover.bind(this));
            });

            // Scroll indicator interaction
            this.elements.scrollIndicators.forEach(indicator => {
                indicator.addEventListener('click', this.handleScrollClick.bind(this));
            });

            // Keyboard navigation for hero section
            document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));

            // Intersection Observer for animations
            this.observeHeroVisibility();
        },

        handleCTAClick(event) {
            event.preventDefault();
            const action = event.currentTarget.dataset.cta;

            // Add loading state
            const originalText = event.currentTarget.textContent;
            event.currentTarget.textContent = 'Loading...';
            event.currentTarget.disabled = true;

            // Simulate async operation
            setTimeout(() => {
                event.currentTarget.textContent = originalText;
                event.currentTarget.disabled = false;

                // Track interaction
                Analytics.trackEvent('hero_cta_click', {
                    action: action,
                    timestamp: Date.now()
                });
            }, 500);
        },

        handleCTAHover(event) {
            event.currentTarget.style.transform = 'translateY(-2px)';
            event.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        },

        handleCTAUnhover(event) {
            event.currentTarget.style.transform = '';
            event.currentTarget.style.boxShadow = '';
        },

        handleScrollClick(event) {
            event.preventDefault();
            const targetSelector = event.currentTarget.dataset.scrollTo;
            const targetElement = document.querySelector(targetSelector);

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });

                Analytics.trackEvent('hero_scroll_click', {
                    target: targetSelector,
                    timestamp: Date.now()
                });
            }
        },

        handleKeyboardNavigation(event) {
            if (!document.activeElement.closest(CSS.escape(CONFIG.heroSelector))) return;

            switch(event.key) {
                case 'Enter':
                    event.preventDefault();
                    const focusedButton = document.activeElement;
                    if (focusedButton.matches('[data-cta]')) {
                        focusedButton.click();
                    }
                    break;
                case 'Escape':
                    if (this.elements.hero.querySelector('.hero-modal')) {
                        this.closeModal();
                    }
                    break;
            }
        },

        observeHeroVisibility() {
            if (!window.IntersectionObserver) {
                log('IntersectionObserver not supported, skipping hero visibility tracking');
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('hero-visible');
                        Analytics.trackEvent('hero_view', {
                            timestamp: Date.now()
                        });
                    }
                });
            }, { threshold: 0.5 });

            if (this.elements.hero) {
                observer.observe(this.elements.hero);
            }
        },

        preloadImages() {
            const imagesToPreload = this.elements.hero.querySelectorAll('[data-preload]');
            imagesToPreload.forEach(img => {
                const preloader = new Image();
                preloader.src = img.src || img.dataset.src;
            });
        }
    };

    // Deferred Analytics Module
    const Analytics = {
        queue: [],
        config: {
            flushInterval: 5000,
            batchSize: 10,
            retryAttempts: 3
        },

        init() {
            log('Initializing deferred analytics...');
            this.setupEventTracking();
            this.startFlushTimer();
            this.setupUnloadHandler();
        },

        trackEvent(eventName, properties = {}) {
            const event = {
                type: eventName,
                properties: {
                    ...properties,
                    url: window.location.href,
                    timestamp: Date.now()
                }
            };

            this.queue.push(event);
            log('Event queued:', event);

            if (this.queue.length >= this.config.batchSize) {
                this.flush();
            }
        },

        async flush() {
            if (this.queue.length === 0) return;

            const events = [...this.queue];
            this.queue = [];

            try {
                const response = await fetch(CONFIG.analyticsEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ events })
                });

                if (!response.ok) {
                    throw new Error(`Analytics flush failed: ${response.status}`);
                }

                const result = await response.json();
                log('Analytics flushed:', result);

            } catch (error) {
                console.error('Analytics flush error:', error);

                // Retry logic
                if (events.length > 0 && navigator.onLine) {
                    this.queue.unshift(...events);
                }

                // Fallback to localStorage for offline storage
                try {
                    const fallbackKey = 'analytics_fallback_' + Date.now();
                    localStorage.setItem(fallbackKey, JSON.stringify(events));
                } catch (storageError) {
                    console.error('Failed to store fallback analytics:', storageError);
                }
            }
        },

        setupEventTracking() {
            // Page performance metrics
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.trackEvent('page_performance', {
                        loadTime: performance.getEntriesByType('navigation')[0]?.loadEventEnd || 0,
                        domContentLoaded: performance.timing?.domContentLoadedEventEnd || 0,
                        firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0
                    });
                }, 100);
            });

            // Error tracking
            window.addEventListener('error', (event) => {
                this.trackEvent('javascript_error', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });

            // Unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.trackEvent('promise_rejection', {
                    reason: event.reason?.toString() || 'Unknown rejection'
                });
            });
        },

        startFlushTimer() {
            setInterval(() => {
                this.flush();
            }, this.config.flushInterval);
        },

        setupUnloadHandler() {
            window.addEventListener('beforeunload', () => {
                if (this.queue.length > 0 && navigator.sendBeacon) {
                    navigator.sendBeacon(
                        CONFIG.analyticsEndpoint,
                        JSON.stringify({ events: this.queue, type: 'beacon' })
                    );
                }
            });
        }
    };

    // Initialization - inline-sync execution pattern
    function init() {
        try {
            // Check if already initialized
            if (window.heroInteractionInitialized) {
                log('Hero interaction already initialized');
                return;
            }

            window.heroInteractionInitialized = true;

            // Initialize hero interaction
            HeroInteraction.init();

            // Initialize analytics
            Analytics.init();

            log('Main.js initialization complete');

        } catch (error) {
            console.error('Main.js initialization failed:', error);

            // Fallback: basic functionality
            const fallbackCTAs = document.querySelectorAll('[data-cta]');
            fallbackCTAs.forEach(cta => {
                cta.addEventListener('click', function(e) {
                    const href = this.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        e.preventDefault();
                        const target = document.querySelector(href);
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                });
            });
        }
    }

    // DOM ready check with fallback
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
        init();
    } else {
        setTimeout(init, 100);
    }
})();
