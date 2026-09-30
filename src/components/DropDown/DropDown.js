"use client";

import React, { useState } from 'react';
import { poseImages } from '../../utils/pose_images';
import './DropDown.css';

export default function DropDown({ poseList, currentPose, setCurrentPose }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => setIsOpen(!isOpen);
    const selectPose = (pose) => {
        setCurrentPose(pose);
        setIsOpen(false);
    };

    return (
        <div className="custom-dropdown-container">
            <button
                className="custom-dropdown-btn"
                onClick={toggleDropdown}
                aria-expanded={isOpen}
            >
                {currentPose}
            </button>
            {isOpen && (
                <ul className="custom-dropdown-menu">
                    {poseList.map((pose) => (
                        <li
                            key={pose}
                            className="custom-dropdown-item"
                            onClick={() => selectPose(pose)}
                        >
                            <div className="custom-dropdown-item-container">
                                <p className="custom-dropdown-text">{pose}</p>
                                <img
                                    src={poseImages[pose]}
                                    alt={pose}
                                    className="custom-dropdown-img"
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
