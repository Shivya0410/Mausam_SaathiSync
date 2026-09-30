"use client";

import { Cards } from "../../components/arthubcards/cards";
import PostList from '../../components/PostList';
import AddPost from '../../components/AddPost';
import Navbar from '../../components/Navbar/navbar';
import BreathingMeditation from '../../components/mentalmed/circle';

// The effect that used to live here looked up an element with id "container"
// and appended the output of Cards() to it. No such element exists in this
// markup, so the effect did nothing except leave a second copy of the cards on
// document.body. Cards is now rendered as a normal component instead.
export const Arthub = () => (
  <div style={{ display: 'flex' }}>
    <div style={{ height: '100vh', top: 0, position: 'sticky', zIndex: 1000 }}>
      <Navbar />
    </div>
    <div className="App">
      <BreathingMeditation />
      <main>
        <Cards />
        <PostList />
        <AddPost />
      </main>
    </div>
  </div>
);

export default Arthub;
