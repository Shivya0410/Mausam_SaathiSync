"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import './AddPost.css';
import creative from "../assets/images/creative.png"
import { useAuth } from '../store/auth';

const AddPost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('image', image);

      await axios.post('https://arunabackend-s3r3.onrender.com/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' 
        }
      });
      console.log('Post added successfully');
      window.location.reload();
      // Optionally, you can redirect or perform any other action after adding the post
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };
  const {isLoggedIN} = useAuth();

  return (
    <div className="container3">
      <div className="image">
      <img src={creative.src} alt='creative'></img>
      </div>
      <div className='inner'>
      <h2>Share your creativity</h2>
      
      {isLoggedIN ? 
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Title:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="form-control" />
        </div>
        <div className="form-group">
          <label>Content:</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="form-control" />
        </div>
        <div className="form-group">
          <label>Image:</label>
          <input type="file" onChange={(e) => setImage(e.target.files[0])} className="form-control-file" />
        </div>
        <button type="submit" className="btn3 btn3-primary" >Submit</button>
      </form> : (<>
                <Link href="/login">Login to add a post</Link>
              </>)}

      
      </div>
    </div>
  );
};

export default AddPost;
