"use client";

import "./cards.css"
import post1 from "../../assets/images/post1.jpeg"
import post2 from "../../assets/images/post2.jpg"
import post3 from "../../assets/images/post3.png"
import post4 from "../../assets/images/post4.jpeg"
import post5 from "../../assets/images/post5.jpeg"
import post6 from "../../assets/images/post6.jpeg"
import post7 from "../../assets/images/post7.jpg"
import post8 from "../../assets/images/post8.jpeg"

// This was previously built with document.createElement at call time and
// appended straight to document.body, which cannot run during a server render
// and also duplicated the list: the function appended the node itself *and*
// returned it for Arthub to append a second time. It is now an ordinary
// component.
//
// The wrapper stays as the custom <sectionarthub> element the original code
// created. cards.css defines a `.sectionarthub` class rule that never matched
// that element, so adding the class here would change the layout.

const posts = [
  {
    image: post1,
    title: 'My Battle with Anxiety: A Personal Journey Towards Healing',
    text: 'Anxiety is a silent predator that can grip your mind and suffocate your soul. As someone who has gain ... ',
  },
  {
    image: post2,
    title: 'Navigating the Depths: A Personal Journey Through Depression',
    text: 'In a world often painted in vibrant colors, there exists a shadow realm where hues fade into shades of ...',
  },
  {
    image: post3,
    title: 'Give me some sunshine, cover by Love Singhal',
    text: 'Living with bipolar disorder is like riding a roller coaster with no seatbelt – exhilarating highs foll...',
  },
  {
    image: post4,
    title: 'Beyond the Surface: Insights into Attention-Deficit(ADHD)',
    text: 'Living with Attention-Deficit /Hyperactivity Disorder (ADHD) is like navigating constantly followed...',
  },
  {
    image: post5,
    title: 'Into the Depths: Journeying through Eating Disorders',
    text: 'Anxiety is a silent predator that can grip your mind and suffocate your soul. As someone who has gain ... ',
  },
  {
    image: post6,
    title: 'Finding Calm in the Storm: Coping with Post-Traumatic Stress Disorder',
    text: 'In a world often painted in vibrant colors, there exists a shadow realm where hues fade into shades of ...',
  },
  {
    image: post7,
    title: 'Unraveling the Mystery: Exploring Borderline Personality Disorder',
    text: 'Living with bipolar disorder is like riding a roller coaster with no seatbelt – exhilarating highs foll...',
  },
  {
    image: post8,
    title: 'Breaking the Silence: Shedding Light on Schizophrenia',
    text: 'Living with Attention-Deficit /Hyperactivity Disorder (ADHD) is like navigating constantly followed...',
  },
];

export const Cards = () => (
  <sectionarthub>
    {posts.map((post, index) => (
      <a href="#" key={index}>
        <article className="card">
          <figure className="card-img">
            <img src={post.image.src} alt="" />
            <figcaption>Anonymous</figcaption>
          </figure>
          <div className="card-body">
            <h2 className="card-title">{post.title}</h2>
            <p className="card-text">{post.text}</p>
          </div>
          <button className="read-more">Read More</button>
        </article>
      </a>
    ))}
  </sectionarthub>
);

export default Cards;
