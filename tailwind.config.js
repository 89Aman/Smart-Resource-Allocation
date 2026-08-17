/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary-fixed": "var(--color-primary-fixed)",
        "on-surface": "var(--color-on-surface)",
        "on-error-container": "var(--color-on-error-container)",
        "on-secondary": "var(--color-on-secondary)",
        "primary-container": "var(--color-primary-container)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        "on-error": "var(--color-on-error)",
        "inverse-surface": "var(--color-inverse-surface)",
        "background": "var(--color-background)",
        "tertiary-container": "var(--color-tertiary-container)",
        "outline": "var(--color-outline)",
        "on-tertiary-fixed": "var(--color-on-tertiary-fixed)",
        "surface-container": "var(--color-surface-container)",
        "on-secondary-container": "var(--color-on-secondary-container)",
        "primary": "var(--color-primary)",
        "on-primary-fixed": "var(--color-on-primary-fixed)",
        "tertiary-fixed": "var(--color-tertiary-fixed)",
        "surface-bright": "var(--color-surface-bright)",
        "secondary": "var(--color-secondary)",
        "primary-fixed-dim": "var(--color-primary-fixed-dim)",
        "on-primary-container": "var(--color-on-primary-container)",
        "surface-container-high": "var(--color-surface-container-high)",
        "on-secondary-fixed-variant": "var(--color-on-secondary-fixed-variant)",
        "secondary-fixed": "var(--color-secondary-fixed)",
        "outline-variant": "var(--color-outline-variant)",
        "on-primary-fixed-variant": "var(--color-on-primary-fixed-variant)",
        "surface-container-low": "var(--color-surface-container-low)",
        "secondary-fixed-dim": "var(--color-secondary-fixed-dim)",
        "inverse-primary": "var(--color-primary-fixed-dim)",
        "error-container": "var(--color-error-container)",
        "tertiary-fixed-dim": "var(--color-tertiary-fixed-dim)",
        "tertiary": "var(--color-tertiary)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "on-primary": "var(--color-on-primary)",
        "on-background": "var(--color-on-surface)",
        "surface": "var(--color-surface)",
        "on-tertiary-fixed-variant": "var(--color-on-tertiary-fixed-variant)",
        "on-tertiary-container": "var(--color-on-tertiary-container)",
        "on-secondary-fixed": "var(--color-on-secondary-fixed)",
        "inverse-on-surface": "var(--color-inverse-on-surface)",
        "surface-tint": "var(--color-primary)",
        "secondary-container": "var(--color-secondary-container)",
        "error": "var(--color-error)",
        "surface-dim": "var(--color-surface-dim)",
        "surface-variant": "var(--color-surface-container-high)",
        "surface-container-highest": "var(--color-surface-container-highest)",
        "on-tertiary": "var(--color-on-tertiary)"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      fontFamily: {
        "headline": ["DM Serif Display", "serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

