const soundFiles = {
  confirm: 'benar.mp3',
  cancel: 'wrong.mp3',
};

const playSound = (type) => {
  const audio = new Audio(`${import.meta.env.BASE_URL}${soundFiles[type]}`);
  audio.volume = 0.5;
  audio.play().catch((error) => {
    console.warn('Audio playback failed.', error);
  });
};

export default playSound;
