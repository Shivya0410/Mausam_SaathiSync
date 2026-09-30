"use client";

import './arthub.css'
import art from "../../assets/images/art.png"
const file = "/media/file.mp4"; // served from public/media

export const Artmain = () => {
    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    };
    return (
        <>
            <div className='arthub'>
                <div className='inner'>
                    <section className="bg-gray-900 h-screen relative flex justify-center items-center mb-20 overflow-hidden mobile-height" >
                        <svg style={{ opacity: 0, position: 'fixed', zIndex: -999 }} viewBox="0 0 1 1">
                            <defs>
                                <clipPath id="clip" clipPathUnits="objectBoundingBox">
                                    <text x="0.5" y="0.4" fontSize="0.15" textAnchor="middle" alignmentBaseline="middle" fontFamily="Roboto">ART THERAPY</text>
                                </clipPath>
                            </defs>
                        </svg>
                        <video autoPlay muted loop playsInline className="absolute z-10 w-auto min-w-full min-h-full max-w-none mobile-video-height normal-video-height">
                            <source src={file} type="video/mp4" />
                            This browser does not support the video tag.
                        </video>

                    </section>
                    <div className="gradient-text">
                        <span className="gradient">An Artistic approach towards Mental Wellness</span>
                    </div>
                    <div className="button-check">
                    <button type="submit" className="btn4 btn4-primary" onClick={scrollToBottom}>Create your Post</button>

                    </div>
                </div>
                <img className="image" src={art.src} alt="art" />
            </div>
        </>
    )
}