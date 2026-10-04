import { useEffect, useState } from 'react';
import { getCooperativeSettings } from '../api/kopsis';

const DEFAULT_SETTINGS = {
  cooperative_name: 'Alz Point',
  address: '',
  phone: '',
  email: '',
  receipt_footer: '',
};

export default function useCooperativeSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;
    getCooperativeSettings()
      .then((response) => {
        if (active) setSettings({ ...DEFAULT_SETTINGS, ...response.data.data });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return settings;
}