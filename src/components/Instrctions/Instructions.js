"use client";

import React from 'react'

import { poseInstructions } from '../../utils/data'

import { poseImages } from '../../utils/pose_images'

import './Instructions.css'

export default function Instructions({ currentPose }) {
    // poseList in the Yoga screen offers a pose called "Pose" that has no
    // entry in poseInstructions, so indexing straight into the object threw
    // when it was selected. Falling back to an empty list keeps that pose
    // usable with its demo image.
    const instructions = poseInstructions[currentPose] || []

    return (
        <div className="instructions-container">
            <ul className="instructions-list">
                {instructions.map((instruction, index) => (
                    <li className="instruction" key={index}>{instruction}</li>
                ))}
            </ul>
            <img
                className="pose-demo-img"
                src={poseImages[currentPose]}
                alt={currentPose}
            />
        </div>
    )
}
