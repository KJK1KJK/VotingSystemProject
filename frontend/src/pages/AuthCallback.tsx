import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    const username = searchParams.get('username');
    const userId = searchParams.get('user_id');

    if (username && userId) {
      // Store user information in cookies
      Cookies.set('username', username, { 
        expires: 1, // 1 day expiry
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      Cookies.set('userId', userId, { 
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      // Redirect to dashboard or home page
      navigate('/');
    } else {
      // Check if we're in the middle of OAuth flow
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      if (code && state) {
        // OAuth flow in progress, don't redirect yet
        return;
      }
      
      // No user info and not in OAuth flow - authentication failed
      navigate('/login?error=authentication_failed');
    }
  }, [navigate, searchParams]);

  return <div>Processing login...</div>;
}