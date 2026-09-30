"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Cards = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://arunabackend-s3r3.onrender.com/api/posts');
        setPosts(response.data.map(post => ({ ...post, showFullContent: false })));
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchData();
  }, []);

  const toggleContent = (index) => {
    const newPosts = [...posts];
    newPosts[index].showFullContent = !newPosts[index].showFullContent;
    setPosts(newPosts);
  };

  const truncateContent = (content) => {
    const words = content.split(' ');
    if (words.length > 10) {
      return words.slice(0, 10).join(' ') + '...';
    }
    return content;
  };

  return (
    <section>
      {posts.map((post, index) => (
        <div key={index} className="card">
          <figure className="card-img">
            {post.imageUrl && <img src={`https://arunabackend-s3r3.onrender.com/${post.imageUrl.replace(/\\/g, '/')}`} alt="Post" />}
            <figcaption>Anonymous</figcaption>
          </figure>
          <div className="card-body">
            <h2 className="card-title">{post.title}</h2>
            <p className="card-text">
              {post.showFullContent ? post.content : truncateContent(post.content)}
              {' '}
              {post.content.split(' ').length > 10 && (
                <button className="read-more" onClick={() => toggleContent(index)}>
                  {post.showFullContent ? 'Read Less' : 'Read More'}
                </button>
              )}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
};

export default Cards;
