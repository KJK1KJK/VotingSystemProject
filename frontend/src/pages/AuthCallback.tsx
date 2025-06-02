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
    const token = searchParams.get('token');
    const userId = searchParams.get('user_id');

    if (token && userId) {
      Cookies.set('authToken', token, { expires: 1 }); //1 day expiry
      Cookies.set('userId', userId, { expires: 7 });
      navigate('/dashboard'); //Redirect to protected route
    } else {
      navigate('/login?error=authentication_failed');
    }
  }, []);

  return <div>Processing login...</div>;
}