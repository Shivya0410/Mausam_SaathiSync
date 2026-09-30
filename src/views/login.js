"use client";

import { Suspense } from 'react';
import Login from '../components/login/login'

const User = () => {
  return (
    <div>
      <Suspense fallback={<p style={{ padding: 24 }}>Loading login…</p>}>
        <Login />
      </Suspense>
    </div>
  );
};

export default User;
