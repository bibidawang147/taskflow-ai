import { useState, useCallback } from 'react';
import { authService } from '../services/auth';

export function useLoginRequired() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | undefined>();

  const checkLogin = useCallback((message?: string): boolean => {
    if (authService.isAuthenticated()) {
      return true;
    }
    setLoginMessage(message);
    setShowLoginModal(true);
    return false;
  }, []);

  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false);
    setLoginMessage(undefined);
  }, []);

  return {
    isAuthenticated: authService.isAuthenticated(),
    showLoginModal,
    loginMessage,
    checkLogin,
    closeLoginModal,
  };
}
