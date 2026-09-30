"use client";

import Navbar from '../components/Navbar/navbar';
import Profile from '../components/profile/profile';   

const Profilepage = () => {
  return (
    <div style={{display:'flex',flexDirection:'row'}}>
      <Navbar />
      <Profile/>
    </div>
  );
};

export default Profilepage;