import React, { useEffect } from 'react';
import { SecurityGuard } from '../utils/security';

export const SecurityToast: React.FC = () => {
  useEffect(() => {
    // Initialize the security guard listeners silently without popups
    SecurityGuard.init();
  }, []);

  // Do not pop up messages for users per request: "users doesn't need to know"
  return null;
};
