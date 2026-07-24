/* theme.js — light/dark theme toggle with localStorage persistence.
   Light default (white + soft blue), dark (charcoal + cyan neon). */

(function () {
  const STORAGE_KEY = 'leadflow_theme';
  const root = document.documentElement;

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    // Repaint any toggle buttons with the correct icon.
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', theme === 'dark');
      btn.innerHTML = theme === 'dark'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    });
  }

  function currentTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  function toggle() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  }

  // Apply immediately (script is loaded in <head>) to avoid a flash.
  apply(currentTheme());

  window.LFTheme = { apply, currentTheme, toggle };

  document.addEventListener('DOMContentLoaded', () => {
    apply(currentTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', toggle);
    });
  });
})();
