import { BACKEND_URL } from './api';

export const fetchUserSettings = async () => {
  const res = await fetch(`${BACKEND_URL}/api/settings`, {
    credentials: 'include'
  });

  if (!res.ok) {
    throw new Error('No se pudo cargar la configuración del usuario');
  }

  return res.json();
};
