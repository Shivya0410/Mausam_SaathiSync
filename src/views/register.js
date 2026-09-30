"use client";

import { Suspense } from 'react';
import Register from '../components/register/register'

const Create = () => {
  return (
    <div>
      <Suspense fallback={<p style={{ padding: 24 }}>Loading registration…</p>}>
        <Register />
      </Suspense>
    </div>
  );
};

export default Create;
