/**
 * Obdotgit's JavaScript Tool Library
 * 
 * copyright 2025 Obdotgit; CC0 1.0 Universal (CC0 1.0) Public Domain Dedication
 * 
 * OJSTL is a collection of lightweight, dependency-free JavaScript utilities. As of now, it includes a modal generator, delta timing and wait functionality.
 * 
 * Modal Dialog Component
 * 
 * Features:
 * - No dependencies
 * - Accessible (ARIA roles, focus management, keyboard navigation)
 * - Customisable (width, height, theme, animation duration, etc.)
 * - Easy to use (no need for jQuery or other libraries)
 * - Supports multiple modals
 * - Promise-based API for handling modal results
 * - Responsive design
 * 
 * Usage:
 * // Show a modal
 * const myModal = modal.show('<p>Hello, World!</p>', {
 *     title: 'My Modal',
 *     closeButtonText: 'Dismiss',
 *     onClose: (result) => { console.log('Modal closed', result); }
 * });
 * 
 * // Hide a modal
 * myModal.hide();
 * 
 * // Handle modal results
 * myModal.then((result) => { console.log('Modal result:', result); });
 * 
 * License:
 * https://creativecommons.org/publicdomain/zero/1.0/
 * 
 * Author: Oliver "Obdotgit" W. (https://github.com/obdotgit/)
**/
(function () {
    'use strict';

    const DEFAULTS = {
        title: 'Modal Title',
        closeButtonText: 'Close',
        onClose: null,
        onOpen: null,
        animation: true,
        animationDuration: 240,
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
        height: 'auto',
        maxHeight: 'calc(100vh - 32px)',
        className: '',
        closeOnEsc: true,
        closeOnOverlayClick: true,
        showCloseButton: true,
        zIndex: 1000,
        autoFocusSelector: null,
        resolveOnClose: false,
        trapFocus: true,
        restoreScroll: true,
        theme: 'light' // 'light' | 'dark'
    };

    const modals = new Set();
    let scrollPosition = 0;

    /**
     * Normalize and validate options
     * @param {Object} options - User provided options
     * @returns {Object} Normalized options
     */
    function normalizeOptions(options = {}) {
        if (typeof options !== 'object' || options === null) {
            console.warn('Modal options must be an object, using defaults');
            return { ...DEFAULTS };
        }

        const opts = { ...DEFAULTS, ...options };

        // Backward compatibility
        if (options.hasOwnProperty('enableAnimation') && !options.hasOwnProperty('animation')) {
            opts.animation = Boolean(options.enableAnimation);
        }

        // Validate numeric values
        if (typeof opts.animationDuration !== 'number' || opts.animationDuration < 0) {
            opts.animationDuration = DEFAULTS.animationDuration;
        }

        if (typeof opts.zIndex !== 'number') {
            opts.zIndex = DEFAULTS.zIndex;
        }

        return opts;
    }

    /**
     * Inject modal styles into the document
     */
    function injectCSS() {
        if (document.getElementById('cg-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'cg-modal-styles';
        style.textContent = `
:root {
    --modal-overlay-bg: rgba(0, 0, 0, 0.6);
    --modal-bg: #ffffff;
    --modal-text: #1a1a1a;
    --modal-border: #e5e7eb;
    --modal-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
    --modal-button-bg: #f3f4f6;
    --modal-button-hover: #e5e7eb;
    --modal-button-text: #374151;
}

.cg-modal-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--modal-overlay-bg);
    opacity: 0;
    transition: opacity 240ms ease;
    z-index: var(--modal-z-index, 1000);
}

.cg-modal-overlay.cg-modal-overlay-open {
    opacity: 1;
}

.cg-modal {
    background-color: var(--modal-bg);
    color: var(--modal-text);
    padding: 24px;
    border-radius: 12px;
    box-shadow: var(--modal-shadow);
    max-width: var(--modal-max-width);
    max-height: var(--modal-max-height);
    outline: none;
    display: flex;
    flex-direction: column;
    opacity: 0;
    transform: translateY(-12px) scale(0.96);
    transition: opacity var(--modal-duration, 240ms) ease,
                transform var(--modal-duration, 240ms) cubic-bezier(0.16, 1, 0.3, 1);
}

.cg-modal.cg-modal-open {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.cg-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.cg-modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.5;
}

.cg-modal-close-icon {
    cursor: pointer;
    padding: 4px;
    border: none;
    background: transparent;
    color: #6b7280;
    border-radius: 4px;
    transition: background-color 150ms ease, color 150ms ease;
    margin-left: 12px;
    flex-shrink: 0;
}

.cg-modal-close-icon:hover {
    background-color: var(--modal-button-hover);
    color: var(--modal-text);
}

.cg-modal-close-icon:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}

.cg-modal-body {
    flex: 1;
    overflow-y: auto;
    margin: 16px 0;
    line-height: 1.6;
}

.cg-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
}

.cg-modal-close {
    cursor: pointer;
    padding: 8px 16px;
    border: 1px solid var(--modal-border);
    background: var(--modal-button-bg);
    color: var(--modal-button-text);
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 150ms ease, border-color 150ms ease;
}

.cg-modal-close:hover {
    background: var(--modal-button-hover);
}

.cg-modal-close:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}

/* Dark theme */
.cg-modal[data-theme="dark"] {
    --modal-bg: #1f2937;
    --modal-text: #f9fafb;
    --modal-border: #374151;
    --modal-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
    --modal-button-bg: #374151;
    --modal-button-hover: #4b5563;
    --modal-button-text: #f9fafb;
}

/* Responsive */
@media (max-width: 640px) {
    .cg-modal {
        padding: 20px;
        border-radius: 8px;
    }
    
    .cg-modal-header h2 {
        font-size: 1.125rem;
    }
}
`;
        document.head.appendChild(style);
    }

    /**
     * Get all focusable elements within a container
     * @param {HTMLElement} container 
     * @returns {HTMLElement[]}
     */
    function getFocusable(container) {
        if (!container) return [];

        const selector = [
            'a[href]:not([tabindex="-1"])',
            'area[href]:not([tabindex="-1"])',
            'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
            'select:not([disabled]):not([tabindex="-1"])',
            'textarea:not([disabled]):not([tabindex="-1"])',
            'button:not([disabled]):not([tabindex="-1"])',
            'iframe:not([tabindex="-1"])',
            'object:not([tabindex="-1"])',
            'embed:not([tabindex="-1"])',
            '[contenteditable]:not([tabindex="-1"])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(',');

        return Array.from(container.querySelectorAll(selector)).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' &&
                   (el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);
        });
    }

    /**
     * Build and display the modal
     * @param {string|HTMLElement} content 
     * @param {Object} opts 
     * @returns {Object} Modal instance
     */
    function buildModal(content, opts) {
        injectCSS();

        // Create elements
        const overlayEl = document.createElement('div');
        const dialogEl = document.createElement('div');
        const headerEl = document.createElement('div');
        const titleEl = document.createElement('h2');
        const bodyEl = document.createElement('div');
        const footerEl = document.createElement('div');

        // Generate unique IDs
        const idSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const titleId = `modal-title-${idSuffix}`;
        const bodyId = `modal-body-${idSuffix}`;

        // Setup overlay
        overlayEl.className = 'cg-modal-overlay';
        overlayEl.style.setProperty('--modal-z-index', opts.zIndex);

        // Setup dialog
        dialogEl.className = `cg-modal ${opts.className}`.trim();
        dialogEl.style.width = opts.width;
        dialogEl.style.height = opts.height;
        dialogEl.style.setProperty('--modal-max-width', opts.maxWidth);
        dialogEl.style.setProperty('--modal-max-height', opts.maxHeight);
        dialogEl.style.setProperty('--modal-duration', `${opts.animationDuration}ms`);
        
        if (opts.theme === 'dark') {
            dialogEl.setAttribute('data-theme', 'dark');
        }

        // ARIA attributes
        dialogEl.setAttribute('role', 'dialog');
        dialogEl.setAttribute('aria-modal', 'true');
        dialogEl.setAttribute('tabindex', '-1');
        dialogEl.setAttribute('aria-labelledby', titleId);
        dialogEl.setAttribute('aria-describedby', bodyId);

        // Setup header
        headerEl.className = 'cg-modal-header';
        titleEl.id = titleId;
        titleEl.textContent = opts.title;
        headerEl.appendChild(titleEl);

        // Add close icon button in header
        if (opts.showCloseButton) {
            const closeIcon = document.createElement('button');
            closeIcon.type = 'button';
            closeIcon.className = 'cg-modal-close-icon';
            closeIcon.innerHTML = '✕';
            closeIcon.setAttribute('aria-label', 'Close modal');
            closeIcon.addEventListener('click', () => hide(false));
            headerEl.appendChild(closeIcon);
        }

        // Setup body
        bodyEl.id = bodyId;
        bodyEl.className = 'cg-modal-body';
        if (content instanceof Node) {
            bodyEl.appendChild(content);
        } else if (typeof content === 'string') {
            bodyEl.innerHTML = content;
        } else {
            console.warn('Invalid modal content provided');
            bodyEl.textContent = '';
        }

        // Setup footer
        footerEl.className = 'cg-modal-footer';
        if (opts.showCloseButton) {
            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.className = 'cg-modal-close';
            closeButton.textContent = opts.closeButtonText;
            closeButton.setAttribute('aria-label', opts.closeButtonText);
            closeButton.addEventListener('click', () => hide(true));
            footerEl.appendChild(closeButton);
        }

        // Assemble modal
        dialogEl.append(headerEl, bodyEl, footerEl);
        overlayEl.appendChild(dialogEl);
        document.body.appendChild(overlayEl);

        // Store previous state
        const previouslyFocused = document.activeElement;
        const bodyOverflowBackup = document.body.style.overflow;
        
        // Save scroll position and lock body
        if (opts.restoreScroll) {
            scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        }
        document.body.style.overflow = 'hidden';

        /**
         * Focus the initial element
         */
        function focusInitial() {
            if (opts.autoFocusSelector) {
                const target = dialogEl.querySelector(opts.autoFocusSelector);
                if (target && typeof target.focus === 'function') {
                    target.focus();
                    return;
                }
            }
            const focusables = getFocusable(dialogEl);
            if (focusables.length > 0) {
                focusables[0].focus();
            } else {
                dialogEl.focus();
            }
        }

        // Apply animations and focus
        if (opts.animation) {
            requestAnimationFrame(() => {
                overlayEl.classList.add('cg-modal-overlay-open');
                requestAnimationFrame(() => {
                    dialogEl.classList.add('cg-modal-open');
                    focusInitial();
                });
            });
        } else {
            overlayEl.classList.add('cg-modal-overlay-open');
            dialogEl.classList.add('cg-modal-open');
            focusInitial();
        }

        /**
         * Trap focus within modal
         */
        function trapFocus(e) {
            if (!opts.trapFocus || e.key !== 'Tab') return;

            const focusables = getFocusable(dialogEl);
            if (focusables.length === 0) {
                e.preventDefault();
                return;
            }

            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }

        /**
         * Handle keyboard events
         */
        function handleKeydown(e) {
            if ((e.key === 'Escape' || e.key === 'Esc') && opts.closeOnEsc) {
                e.preventDefault();
                hide(false);
            }
            trapFocus(e);
        }

        /**
         * Handle overlay clicks
         */
        function handleOverlayClick(e) {
            if (opts.closeOnOverlayClick && e.target === overlayEl) {
                hide(false);
            }
        }

        // Promise support
        let resolvePromise;
        const promise = opts.resolveOnClose 
            ? new Promise(resolve => { resolvePromise = resolve; }) 
            : null;

        /**
         * Hide the modal
         * @param {boolean} result - Result to pass to promise
         */
        function hide(result = true) {
            if (opts.animation) {
                dialogEl.classList.remove('cg-modal-open');
                overlayEl.classList.remove('cg-modal-overlay-open');
                setTimeout(() => cleanup(result), opts.animationDuration);
            } else {
                cleanup(result);
            }
        }

        /**
         * Clean up modal and restore state
         */
        function cleanup(result) {
            overlayEl.remove();
            document.removeEventListener('keydown', handleKeydown);
            
            // Restore focus
            if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                try {
                    previouslyFocused.focus();
                } catch (e) {
                    console.warn('Could not restore focus:', e);
                }
            }

            // Restore body scroll
            document.body.style.overflow = bodyOverflowBackup;
            if (opts.restoreScroll && scrollPosition > 0) {
                window.scrollTo(0, scrollPosition);
            }

            // Call callbacks
            if (typeof opts.onClose === 'function') {
                try {
                    opts.onClose(result);
                } catch (e) {
                    console.error('Error in onClose callback:', e);
                }
            }

            if (resolvePromise) {
                resolvePromise(result);
            }

            modals.delete(instance);
        }

        // Attach event listeners
        overlayEl.addEventListener('click', handleOverlayClick);
        document.addEventListener('keydown', handleKeydown);

        // Create instance
        const instance = {
            hide,
            overlayEl,
            dialogEl,
            promise,
            update: (newContent) => {
                if (newContent instanceof Node) {
                    bodyEl.textContent = '';
                    bodyEl.appendChild(newContent);
                } else if (typeof newContent === 'string') {
                    bodyEl.innerHTML = newContent;
                }
            }
        };

        modals.add(instance);

        // Call onOpen callback
        if (typeof opts.onOpen === 'function') {
            try {
                opts.onOpen(instance);
            } catch (e) {
                console.error('Error in onOpen callback:', e);
            }
        }

        return instance;
    }

        /**
     * Show a modal prompt with an input field.
     * @param {string} message - The message or label for the input.
     * @param {Object} options - Modal options, plus input options.
     *   options.inputType: HTML input type (default 'text')
     *   options.inputInitial: Initial value (default '')
     *   options.inputPlaceholder: Input placeholder (default '')
     *   options.inputLabel: Label for input (default: message arg)
     *   options.resolveOnClose: Always true for prompt.
     * @returns {Promise<string|null>} Promise resolves with value or null if cancelled.
     */
    function promptModal(message, options = {}) {
        const opts = normalizeOptions({
            ...options,
            resolveOnClose: true
        });

        // Input element
        const inputType = options.inputType || 'text';
        const inputInitial = options.inputInitial || '';
        const inputPlaceholder = options.inputPlaceholder || '';
        const inputLabel = options.inputLabel || message || opts.title;

        const inputId = `cg-modal-input-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const inputEl = document.createElement('input');
        inputEl.type = inputType;
        inputEl.value = inputInitial;
        inputEl.placeholder = inputPlaceholder;
        inputEl.id = inputId;
        inputEl.className = 'cg-modal-prompt-input';
        inputEl.style = 'width: 100%; margin-top: 8px;';

        // Label
        const labelEl = document.createElement('label');
        labelEl.htmlFor = inputId;
        labelEl.textContent = inputLabel;

        // Container
        const container = document.createElement('div');
        container.appendChild(labelEl);
        container.appendChild(inputEl);

        // Result holder
        let result = null;

        // Modal
        const modalInstance = buildModal(container, {
            ...opts,
            autoFocusSelector: '.cg-modal-prompt-input',
            onClose: (ok) => {
                if (!ok) result = null;
                if (typeof opts.onClose === 'function') {
                    opts.onClose(ok ? result : null);
                }
            }
        });

        // Intercept close to return value or null
        if (modalInstance.promise) {
            // Listen for Enter key on input
            inputEl.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    result = inputEl.value;
                    modalInstance.hide(true);
                }
            });

            // Listen for modal close button
            // Already closes with false (cancel) or true (OK)
            // Override close button to treat as "OK"
            const closeBtns = modalInstance.dialogEl.querySelectorAll('.cg-modal-close');
            closeBtns.forEach(btn => {
                btn.removeEventListener('click', btn.onclick);
                btn.onclick = () => {
                    result = inputEl.value;
                    modalInstance.hide(true);
                };
            });

            // Focus input
            setTimeout(() => inputEl.focus(), opts.animation ? opts.animationDuration : 0);

            return modalInstance.promise.then(ok => (ok ? result : null));
        }
        return Promise.resolve(null);
    }

    const delta = {
        tick: function (update, render) {
            var lastUpdate = Date.now();
            var myInterval = setInterval(tick, 0);
            function tick() {
                var now = Date.now();
                var dt = now - lastUpdate;
                lastUpdate = now;
                update(dt);
                render(dt); 
            } 
            return myInterval;
        },
        toString: function (dt) {
            var s = "";
            if (dt >= 3600000) {
                s += Math.floor(dt / 3600000) + "h ";
                dt = dt % 3600000;
            }
            if (dt >= 60000) {
                s += Math.floor(dt / 60000) + "m "; 
                dt = dt % 60000;
            }
            if (dt >= 1000) {
                s += Math.floor(dt / 1000) + "s ";
                dt = dt % 1000;
            } if (dt > 0) {
                s += dt + "ms";
            }
            return s.trim();
        }
    };

    const wait = {
        ms: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
        s: (s) => wait.ms(s * 1000),
        m: (m) => wait.s(m * 60),
        h: (h) => wait.m(h * 60),
        frames: (frames = 1) => {
            return new Promise(resolve => {
                let count = 0;
                const frameHandler = () => {
                    count++;
                    if (count < frames) {
                        requestAnimationFrame(frameHandler);
                    } else {
                        resolve();
                    }
                };
                requestAnimationFrame(frameHandler);
            });
        }
    };

    // Public API
    window.modal = {
        /**
         * Show a modal
         * @param {string|HTMLElement} content - Modal content
         * @param {Object} options - Modal options
         * @returns {Object} Modal instance
         */
        show(content, options = {}) {
            return buildModal(content, normalizeOptions(options));
        },

        /**
         * Close all open modals
         */
        closeAll() {
            modals.forEach(modal => modal.hide(false));
        },

        /**
         * Get count of open modals
         * @returns {number}
         */
        getOpenCount() {
            return modals.size;
        },

        /**
         * Get all open modal instances
         * @returns {Array}
         */
        getAll() {
            return Array.from(modals);
        }

        /**
         * Show a prompt modal with input
         * @param {string} message
         * @param {Object} options
         * @returns {Promise<string|null>}
         */
        prompt: promptModal,
    };

    window.delta = delta;

    window.wait = wait;
})();
