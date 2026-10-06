const soundFiles = {
  click: 'click.mp3',
  confirm: 'confirm.mp3',
  cancel: 'cancel.mp3',
  reset: 'reset.mp3',
};

const getSoundPreferenceKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return `sound-effects:${user?.user_id ?? user?.username ?? 'guest'}`;
  } catch {
    return 'sound-effects:guest';
  }
};

export const areSoundEffectsEnabled = () => {
  try {
    return localStorage.getItem(getSoundPreferenceKey()) !== 'false';
  } catch {
    return true;
  }
};

export const setSoundEffectsEnabled = (enabled) => {
  try {
    localStorage.setItem(getSoundPreferenceKey(), String(enabled));
  } catch {
    // Keep sound enabled for the current page when storage is unavailable.
  }
};

const playSound = (type) => {
  if (!areSoundEffectsEnabled() || !soundFiles[type]) return;

  const audio = new Audio(`${import.meta.env.BASE_URL}${soundFiles[type]}`);
  audio.volume = 0.5;
  audio.play().catch((error) => {
    console.warn('Audio playback failed.', error);
  });
};

export default playSound;
