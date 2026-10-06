export const GSAP_PREFERENCE_EVENT = 'gsap-preference-change';
export const HIDE_IMAGES_PREFERENCE_EVENT = 'hide-images-preference-change';

const getStorageKey = (prefix) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return `${prefix}:${user?.user_id ?? user?.username ?? 'guest'}`;
  } catch {
    return `${prefix}:guest`;
  }
};

// --- GSAP ANIMATIONS PREFERENCE ---

export const areGsapAnimationsEnabled = () => {
  try {
    return localStorage.getItem(getStorageKey('gsap-animations')) !== 'false';
  } catch {
    return true;
  }
};

export const setGsapAnimationsEnabled = (enabled) => {
  try {
    localStorage.setItem(getStorageKey('gsap-animations'), String(enabled));
  } catch {
    // Keep the setting active for the current page when storage is unavailable.
  }

  window.dispatchEvent(new CustomEvent(GSAP_PREFERENCE_EVENT, { detail: { enabled } }));
};

// --- HIDE IMAGES PREFERENCE ---

export const isCashierImageHidden = () => {
  try {
    return localStorage.getItem(getStorageKey('hide-images')) === 'true';
  } catch {
    return false;
  }
};

export const setCashierImageHidden = (hidden) => {
  try {
    localStorage.setItem(getStorageKey('hide-images'), String(hidden));
  } catch {
    // Keep the setting active for the current page when storage is unavailable.
  }

  window.dispatchEvent(new CustomEvent(HIDE_IMAGES_PREFERENCE_EVENT, { detail: { hidden } }));
};

// Alias / cadangan untuk kompatibilitas nama fungsi lain
export const areImagesHidden = isCashierImageHidden;
export const setHideImagesEnabled = setCashierImageHidden;