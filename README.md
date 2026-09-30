# SWASTH INFINITY: A HOLISTIC WELLNESS APP
Our main offerings include:
## 1. Virtual Forest with HTML A-Frames 
Interactive Virtual Environment
Users can explore a 3D virtual forest built using HTML A-Frames.

Gamification for Sustainability
Tracks eco-friendly activities and fitness goals, rewarding users with virtual trees and badges.

Customization
Users can design and personalize their forests based on progress and achievements.

## 2. Real-Time Yoga Posture Monitoring System
AI-Based Pose Detection
Integrates MoveNet for real-time monitoring of yoga poses.

Posture Correction Feedback
Provides instant suggestions to correct form and alignment during yoga exercises.

Progress Tracking
Logs pose performance data to monitor flexibility, balance, and strength improvements.

## 3. Health Risk Prediction
Machine Learning-Based Risk Assessment
Uses Random Forest Classifier to predict health risk levels (Low, Medium, High) based on user inputs.

BMI and Body Shape Analysis
Computes Body Mass Index (BMI) and classifies users as:

Underweight
Normal
Overweight
Obese
Waist-to-Hip Ratio (WHR)
Evaluates fat distribution and body shape based on waist and hip measurements.

## 4. Diet Recommender System 
AI-Driven Recommendations
Suggests personalized diet plans based on:

Body metrics
Fitness goals
Nutritional preferences
Alternative Food Suggestions
Provides healthier alternatives for commonly consumed junk foods.

Integration with Recipe Databases
Uses OpenFoodFacts and USDA datasets to recommend meals rich in essential nutrients.

Real-Time Nutritional Tracking
Monitors macronutrient and micronutrient intake to help users meet dietary targets.

## 5. Personalized Advice and Recommendations
Lifestyle Suggestions
Offers tips for improving health based on BMI, WHR, and body fat percentage.

Health Risk Warnings
Alerts users about potential health issues like obesity, heart disease, and diabetes.

Exercise and Activity Recommendations
Suggests cardio, strength, and flexibility workouts tailored to fitness levels.

## 6. Chat Consulting with Experts 
Connect with Top Professionals
In-built chat system to consult:

Psychologists for mental health and stress management.
Therapists for therapy and well-being tips.
Fitness Trainers for workout and fitness plans.
Expert Profiles

Displays qualifications and areas of expertise.
Allows users to select preferred consultants.
Personalized Interaction
AI chatbots and human experts collaborate for instant advice and long-term plans.

## 7. User Blogs and Recipe Sharing Platform 
Community-Driven Content
Allows users to share healthy recipes and personal fitness journeys.

Category-Based Filters
Blogs sorted into categories like:

Vegan, Keto, Low-Carb, High-Protein, etc.
Interactive Features
Users can like, comment, and save recipes to their profiles.

Featured Blogs Section
Highlights popular recipes and inspirational transformation stories.

Recipe Ratings and Nutritional Breakdown
Shows ratings and nutritional content for each recipe.






# Getting Started

This project runs on [Next.js](https://nextjs.org) using the App Router. It was
originally bootstrapped with Create React App and migrated across; the routes
now live as `page.js` files under `src/app/`.

## Setup

```bash
npm install
cp .env.example .env.local   # then point NEXT_PUBLIC_API_BASE_URL at your backend
```

`NEXT_PUBLIC_API_BASE_URL` is the base URL of the Swasth Infinity backend. The
app appends `/api/auth` and `/api/admin` to it. For local backend development
set it to `http://localhost:5000`.

## Available Scripts

### `npm run dev`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000)
with hot reloading.

### `npm run build`

Builds the app for production into `.next`. This step prerenders every route on
the server, so it is also what catches browser-only code that would break
server rendering. Treat a build failure as a real defect, not a config problem.

### `npm start`

Serves the production build. Run `npm run build` first.

### `npm run lint`

Runs the Next.js linter.

## Project layout

- `src/app/` — routes. Each directory holds a `page.js` that re-exports a
  component, plus the shared `layout.js`, `providers.js` and `loading.js`.
- `src/components/` — the UI components the routes render.
- `src/views/` — page-level wrappers that compose components, kept from the
  original structure. Not to be confused with the Next.js Pages Router.
- `src/services/` — backend calls and the API base URL configuration.
- `src/store/` — the authentication context.
- `public/` — static files served at the site root, including the A-Frame
  virtual forest and the SheFit microsite.

## Notes

- Nearly every component carries a `"use client"` directive. Note that this does
  not disable server rendering: client components are still prerendered at build
  time, so browser-only APIs must be used inside effects.
- Leaflet and TensorFlow.js are loaded through `next/dynamic` with `ssr: false`
  because they touch `window` when their modules are evaluated.
- `@mediapipe/pose` is aliased to a stub in `next.config.js`. See
  `src/shims/mediapipe-pose.js` for why.

## Learn More

- [Next.js documentation](https://nextjs.org/docs)
- [React documentation](https://react.dev)
