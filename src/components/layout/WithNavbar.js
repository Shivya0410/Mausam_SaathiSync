"use client";

import Navbar from '../Navbar/navbar';

export default function WithNavbar({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', backgroundColor: '#f5f0fd' }}>
      <div style={{ height: '100vh', top: 0, position: 'sticky' }}>
        <Navbar />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
