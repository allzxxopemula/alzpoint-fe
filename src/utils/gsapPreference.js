export const GSAP_PREFERENCE_EVENT = 'gsap-preference-change';

const getPreferenceKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return `gsap-animations:${user?.user_id ?? user?.username ?? 'guest'}`;
  } catch {
    return 'gsap-animations:guest';
  }
};

export const areGsapAnimationsEnabled = () => {
  try {
    return localStorage.getItem(getPreferenceKey()) !== 'false';
  } catch {
    return true;
  }
};

export const setGsapAnimationsEnabled = (enabled) => {
  try {
    localStorage.setItem(getPreferenceKey(), String(enabled));
  } catch {
    // Keep the setting active for the current page when storage is unavailable.
  }

  window.dispatchEvent(new CustomEvent(GSAP_PREFERENCE_EVENT, { detail: { enabled } }));
};