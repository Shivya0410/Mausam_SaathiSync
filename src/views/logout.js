"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../store/auth';

export default function Logout() {
  const { LogoutUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    LogoutUser();
    // `replace` rather than `push` so the back button does not return to the
    // logout route and clear the token again, matching React Router's
    // <Navigate> which did not push a history entry either.
    router.replace('/login');
  }, [LogoutUser, router]);

  return null;
}
