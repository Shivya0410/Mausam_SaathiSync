"use client";

import React, { useState } from 'react';
import './RecipeSection.css';
import { useTranslation } from 'react-i18next';


const RecipeSection = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [isYouTube, setIsYouTube] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Expanded video data with regional categories
  const videos = [
    // North Indian Recipes
    { 
      title: 'Moong Dal Cheela With Stuffed Paneer ', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321243/north1_lbpza8.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733321824/north1_c3i9nt.mp4",  
      description: 'A healthy and protein-rich savory pancake made from ground moong dal batter, lightly spiced, and cooked to golden perfection. The cheela is stuffed with a flavorful paneer filling, making it a wholesome and delicious dish, often enjoyed with chutney or yogurt. Perfect for breakfast or a light meal!', 
      region: 'north',
      isYouTube: false
    },
    { 
      title: 'Kabuli Chana Salad', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321255/north2_bmx54z.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733321874/north2_p1l74l.mp4",  
      description: 'A nutritious and refreshing salad made with boiled chickpeas (Kabuli Chana), fresh vegetables, and zesty spices. It’s a perfect blend of crunch and flavor, ideal for a light snack or side dish.', 
      region: 'north',
      isYouTube: false
    },
    { 
      title: 'Aloo Simla Mirch Ki Sabzi', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321256/north3_ajlfag.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733321932/north3_d9vyam.mp4",  
      description: 'A simple yet flavorful dry curry made with potatoes and capsicum stir-fried in aromatic Indian spices. This dish pairs wonderfully with parathas or chapatis for a wholesome meal.', 
      region: 'north',
      isYouTube: false
    },
    { 
      title: 'Suji Ki Kheer', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321257/north4_mcdlhy.jpg",
      videoLink:  "https://res.cloudinary.com/db5hrms2s/video/upload/v1733322143/north4_cktjm4.mp4",  
      description: 'A creamy and rich dessert made with semolina (suji), milk, and sugar, flavored with cardamom and garnished with nuts. This quick and easy kheer is a delightful treat for any occasion.', 
      region: 'north',
      isYouTube: false
    },
    { 
      title: 'Beetroot Paratha', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321270/north5_tjnnm3.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733318815/north5_unktrd.mp4",  
      description: 'A vibrant, nutritious paratha made with grated beetroot kneaded into whole wheat flour, spiced with Indian flavors. It’s a healthy and delicious option for breakfast or lunch, served with curd or pickle.', 
      region: 'north',
      isYouTube: false
    },
    { 
      title: 'Lauki Channa Dal', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321271/north6_gjtl43.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733318901/north6_wyyrwy.mp4",  
      description: 'A wholesome curry made with bottle gourd (lauki) and split Bengal gram (channa dal), cooked in a mildly spiced gravy. This dish is both nutritious and comforting, perfect with steamed rice or rotis.', 
      region: 'north',
      isYouTube: false
    },
    { 
      title: 'Sarson ka Saag with Makki di Roti', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321279/north7_lyg8en.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733318890/north7_bbdu1w.mp4",  
      description: 'A classic Punjabi dish made with mustard greens (sarson) and other leafy greens, slow-cooked with spices and served with makki di roti, a flatbread made from cornmeal. This winter delicacy is a celebration of rustic flavors.', 
      region: 'north',
      isYouTube: false
    },
    { 
      title: 'Sprout Salad with Millets', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321281/north8_sy3mtv.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733318884/north8_jifzam.mp4",  
      description: 'A power-packed salad combining sprouted legumes with nutrient-rich millets, tossed with tangy lemon juice and spices. It’s a healthy and tasty choice for a light meal or snack.', 
      region: 'north',
      isYouTube: false
    },
    { 
      title: 'Masala Khichdi', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321283/north9_sswqgb.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733318881/north9_oi4wab.mp4",  
      description: 'A comforting one-pot meal made with rice, lentils, vegetables, and a blend of spices. This spiced-up version of the classic khichdi is both nourishing and satisfying.', 
      region: 'north',
      isYouTube: false
    },
    { 
      title: 'Mix Veg Paratha', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321285/north10_xutel1.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733318915/north10_povrrt.mp4",  
      description: 'A hearty and flavorful stuffed paratha filled with a mix of finely chopped or grated vegetables and spices. Served hot with butter, yogurt, or pickle, it’s a versatile dish for any time of the day.', 
      region: 'north',
      isYouTube: false
    },
    
    // South Indian Recipes
    { 
      title: 'High Protein Soya Chunks Nutri Dosa', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321142/south1_n76n3t.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733319305/south1_jruixk.mp4",  
      description: 'A nutritious twist on the classic dosa, this high-protein version is made by incorporating soya chunks into the batter. The result is a crispy dosa packed with plant-based protein, making it an excellent breakfast option for muscle repair and energy. Pair it with chutneys for a balanced meal.', 
      region: 'south',
      isYouTube: false
    },
    { 
      title: 'Beetroot Pachadi', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321142/south2_swsa79.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733319255/south2_hpvtil.mp4",  
      description: 'A vibrant and refreshing yogurt-based dish made with grated beetroot, tempered with mustard seeds and curry leaves. Rich in antioxidants and fiber, beetroot pachadi is an ideal accompaniment to your meal, promoting digestion and improving skin health.', 
      region: 'south',
      isYouTube: false
    },
    { 
      title: 'Millet Idli', 
      thumbnail:  "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321142/south3_dfbisq.jpg",
      videoLink:  "https://res.cloudinary.com/db5hrms2s/video/upload/v1733319331/south3_nqr3gp.mp4",  
      description: 'Millet idli is a healthy, gluten-free alternative to the traditional rice idli. Made with millet flour, these soft and spongy idlis are rich in fiber, vitamins, and minerals, providing a nutritious start to the day. Pair with sambar or chutney for a complete meal.', 
      region: 'south',
      isYouTube: false
    },
    { 
      title: 'Chickpea Sundal', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321142/south4_lkosil.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733319333/south4_lkzzlb.mp4",  
      description: 'Chickpea sundal is a nutritious snack made with boiled chickpeas, tempered with mustard seeds, coconut, and curry leaves. It’s high in protein and fiber, making it a perfect post-workout snack or light meal that supports muscle building and digestion.', 
      region: 'south',
      isYouTube: false
    },
    { 
      title: 'Vegetable Upma', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321142/south5_ti9qvt.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733319321/south5_nwmkwu.mp4",  
      description: 'It is a Classic South Indian delight made from semolina, packed with colourful vegetables like carrots, peas and beans . To accentuate the taste and flavour , add a tadka of mustard seeds, curry leaves and red chilies to give it a spicy touch', 
      region: 'south',
      isYouTube: false
    },
    { 
      title: 'Curd rice with Pickles', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733321143/south6_oam5hk.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733319305/south6_jk6vex.mp4",  
      description: 'A comforting dish made by mixing cooked rice with curd, which is further topped with a tadka of mustard seeds, red chilies and curry leaves.Pair it with a small serving of homemade pickles for a tangy kick, making it an easy,refreshing option.', 
      region: 'south',
      isYouTube: false
    },

    // East Indian Recipes
    { 
      title: 'Bengali Mishti Doi', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733320475/east1_zdpcsc.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733316626/east1_uiasdk.mp4",  
      description: 'A delicious Bengali dessert made from sweetened yogurt, Mishti Doi is rich in probiotics, calcium, and protein. The slow fermentation process gives it a smooth, creamy texture and a subtle sweetness, making it a perfect way to aid digestion and improve gut health.', 
      region: 'east',
      isYouTube: false
    },
    { 
      title: 'Odia Chenna Poda', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733320476/east2_tryu0h.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733316966/east2_l4ircn.mp4",  
      description: 'A baked dessert made from fresh chhena (Indian cottage cheese), sugar, and cardamom. This traditional Odia dish is high in protein, calcium, and low in fat, making it a healthier indulgence that satisfies your sweet tooth while offering nutritional benefits.', 
      region: 'east',
      isYouTube: false
    },
    { 
      title: 'Vegetable Thukpa', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733320476/east3_sxquip.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733322121/east3_d729be.mp4",  
      description: 'A flavorful noodle soup made with mixed vegetables, thukpa is a popular East Indian dish that’s both filling and healthy. Packed with nutrients from vegetables and light broth, it’s a great option for boosting immunity and digestion.', 
      region: 'east',
      isYouTube: false
    },
    { 
      title: 'Aamat', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733320476/east4_dg22fm.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733317065/east4_noomus.mp4",  
      description: 'A tangy and spicy stew made from a mix of vegetables and tamarind, Aamat is a traditional Odisha dish. Rich in antioxidants and vitamin C from the tamarind and vegetables, it’s great for digestion and boosting immunity.', 
      region: 'east',
      isYouTube: false
    },
    { 
      title: 'Dalma (Mixed Vegetable Lentil Stew)', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733320476/east5_bebdly.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733317084/east5_mys4py.mp4",  
      description: 'A hearty, nutritious stew made with a mix of lentils and vegetables like pumpkin, eggplant, and potatoes. It’s rich in protein and fiber, promoting good digestion and making it a wholesome meal for overall health.', 
      region: 'east',
      isYouTube: false
    },
    { 
      title: 'Sattu Paratha', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733320476/east6_iw3f2q.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733317080/east6_wgudso.mp4",  
      description: 'Made with roasted gram flour (sattu) and spices, this paratha is rich in protein and fiber. It’s an excellent source of energy, helping to keep you full longer. Perfect for breakfast or lunch, served with yogurt or chutney for a healthy, satisfying meal.', 
      region: 'east',
      isYouTube: false
    },
    
    // West Indian Recipes
    { 
      title: 'Gujarati Ragi Dhokla', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733320835/west1_ouwr5z.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733318544/west1_vdtfon.mp4",  
      description: 'A healthy twist on the traditional dhokla, this recipe uses ragi (finger millet), which is rich in calcium, iron, and fiber. It’s a great source of energy and helps in improving bone health and digestion. The spongy texture and light spices make it a perfect snack or breakfast.', 
      region: 'west',
      isYouTube: false
    },
    { 
      title: 'Maharashtrian Zunka Bhakar', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733320836/west2_l6hidx.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733318575/west2_yldqfi.mp4",  
      description: 'A traditional Maharashtrian dish, Zunka is made with chickpea flour (besan) and is paired with Bhakar, a type of flatbread made from millet or wheat. It’s a wholesome, protein-packed meal with a good amount of fiber, making it great for digestion and energy.', 
      region: 'west',
      isYouTube: false
    },
    { 
      title: 'Bajre ki Roti with Dal', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733320836/west3_ywes6u.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733318564/west3_cgocta.mp4",  
      description: 'Bajra (pearl millet) roti, paired with a nutritious dal, is a traditional combination from Rajasthan and Gujarat. Bajra is rich in iron, fiber, and antioxidants, while dal provides protein, making it a wholesome meal that aids digestion and strengthens immunity.', 
      region: 'west',
      isYouTube: false
    },
    { 
      title: 'Gujarati Methi Thepla', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733320836/west4_pl9bmd.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733318536/west4_hijyfk.mp4",  
      description: 'Methi thepla is a flavorful flatbread made with fenugreek leaves, whole wheat flour, and spices. Rich in iron and fiber, it’s perfect for improving digestion, boosting immunity, and providing sustained energy. It’s often enjoyed with yogurt or pickles.', 
      region: 'west',
      isYouTube: false
    },
    { 
      title: 'Gatte ki Sabzi', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733320836/west5_ggtoom.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733318598/west5_pzf0un.mp4",  
      description: 'A traditional Rajasthani dish, Gatte ki Sabzi is made with gram flour dumplings cooked in a spicy yogurt-based gravy. High in protein and rich in flavor, it’s a great vegetarian option that’s both filling and nutritious.', 
      region: 'west',
      isYouTube: false
    },
    { 
      title: 'Poha', 
      thumbnail: "https://res.cloudinary.com/db5hrms2s/image/upload/v1733320837/west6_wgwoie.jpg",
      videoLink: "https://res.cloudinary.com/db5hrms2s/video/upload/v1733318571/west6_xfgqlv.mp4",  
      description: 'Poha is a popular breakfast dish made with flattened rice, mustard seeds, turmeric, and vegetables. It’s light, easily digestible, and a great source of carbohydrates, fiber, and vitamins, making it a great start to your day while promoting digestive health.', 
      region: 'west',
      isYouTube: false
    }
  ];

  // Like counts and comments were hardcoded into each recipe record and shown
  // as though people had left them. There is no backend behind either, so they
  // were removed rather than presented as real activity.
  const openModal = (videoLink, description, isYouTube) => {
    setCurrentVideo(videoLink);
    setIsYouTube(isYouTube);
    setCurrentDescription(description);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentVideo('');
  };

  const REGION_META = {
    all: { icon: 'fa-solid fa-earth-asia', tint: 'Winter · Summer · Monsoon · Desert', desc: 'From Himalayan mustard fields to coastal coconut groves — 28 dishes, one India.', scene: ['fa-solid fa-leaf', 'fa-solid fa-wheat-awn', 'fa-solid fa-water', 'fa-solid fa-sun'] },
    north: { icon: 'fa-solid fa-mountain-sun', tint: 'North · Winter hearty', desc: 'Mustard greens, ghee-kissed parathas and slow-simmered dals from the wheat belt.', scene: ['fa-solid fa-snowflake', 'fa-solid fa-mountain', 'fa-solid fa-wheat-awn', 'fa-solid fa-fire'] },
    south: { icon: 'fa-solid fa-leaf', tint: 'South · Coastal light', desc: 'Coconut, curry leaves, millet and curd rice — cool, coastal and light.', scene: ['fa-solid fa-water', 'fa-solid fa-leaf', 'fa-solid fa-umbrella-beach', 'fa-solid fa-spa'] },
    east: { icon: 'fa-solid fa-cloud-sun-rain', tint: 'East · Monsoon fresh', desc: 'Mustard oil, fermented sweets and river greens from Bengal to the Northeast.', scene: ['fa-solid fa-cloud-rain', 'fa-solid fa-seedling', 'fa-solid fa-fish', 'fa-solid fa-spa'] },
    west: { icon: 'fa-solid fa-sun', tint: 'West · Sun & spice', desc: 'Millets, jaggery and Rajasthani sun fare — dry-heat nourishment.', scene: ['fa-solid fa-sun', 'fa-solid fa-pepper-hot', 'fa-solid fa-wind', 'fa-solid fa-mountain-sun'] },
  };

  // Filter videos based on selected region
  const filteredVideos = selectedRegion === 'all' 
    ? videos 
    : videos.filter(video => video.region === selectedRegion);
  const meta = REGION_META[selectedRegion] || REGION_META.all;
    return (
      <div className={`recipe-section season-${selectedRegion}`}>
      <div key={selectedRegion} className="season-scene" aria-hidden="true">
        {meta.scene.map((ic, i) => (
          <i key={i} className={`${ic} season-float season-float-${i + 1}`}></i>
        ))}
      </div>
      <h2 className="recipe-title">{t('recipeSection.title', { defaultValue: 'Regional Recipes' })}</h2>
      <div className="region-selector">
        {['all', 'north', 'south', 'east', 'west'].map(region => (
          <button 
            key={region}
            className={selectedRegion === region ? 'active' : ''}
            onClick={() => setSelectedRegion(region)}
          >
            {t(`recipeSection.region.${region}`, { defaultValue: region })}
          </button>
        ))}
      </div>
      <div key={`${selectedRegion}-banner`} className="season-banner" aria-live="polite">
        <span className="season-banner-icon"><i className={meta.icon}></i></span>
        <div className="season-banner-text">
          <strong>{meta.tint}</strong>
          <span>{meta.desc}</span>
        </div>
        <span className="season-banner-count">{filteredVideos.length} recipes</span>
      </div>
      <div className="recipe-thumbnails">
          {filteredVideos.map((video, index) => (
            <div 
              key={index} 
              className="recipe-thumbnail" 
              onClick={() => openModal(
                video.videoLink,
                video.description,
                video.isYouTube
              )}
            >
              <img src={video.thumbnail} alt={video.title} loading="lazy" />
              <div className="recipe-name">
                <h4>{video.title}</h4>
              </div>
              <div className="recipe-foot" aria-hidden="true">
                <i className="fa-brands fa-youtube"></i>
                <span>Watch recipe</span>
              </div>
            </div>
          ))}
        </div>
        {showModal && (
          <div className="modal" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {isYouTube ? (
                <iframe
                  width="100%"
                  height="400px"
                  src={currentVideo}
                  title="Recipe Video"
                  frameBorder="0"
                  allowFullScreen
                ></iframe>
              ) : (
                <video
                  width="100%"
                  height="400px"
                  controls
                  src={currentVideo}
                >
                  Your browser does not support the video tag.
                </video>
              )}
  
              <div className="video-info">
                <p>{currentDescription}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default RecipeSection;
