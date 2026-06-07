# SEEBURGER Interview Management & Evaluation

A comprehensive web-based tool designed to assist engineering and HR teams in screening resumes and building standardized technical interview scorecards.

## Features
- **Technical Assessment Builder:** Automatically generate structured, multi-round technical interview kits (Tech 1, Tech 2, Managerial) from a Job Description and Candidate CV.
- **Batch CV Screener:** Upload multiple resumes simultaneously and instantly screen them against specific Job Description requirements to filter top talent.
- **Reports History:** Tracks past evaluations and pre-screening batch reports. Data is natively synced to Firebase Firestore.

## How to Run Locally

This is a static web application built with vanilla HTML, CSS, and JavaScript. No complex build pipelines are required!

### Option 1: Live Server (Recommended)
If you are using VS Code, simply install the **Live Server** extension, open `index.html`, right-click, and select "Open with Live Server".

### Option 2: Using Node.js
If you have Node.js installed, you can use the lightweight Express server included in the project.

1. Open your terminal in the project directory.
2. Install the necessary dependencies:
   ```bash
   npm install express
   ```
3. Start the local server:
   ```bash
   node server.js
   ```
4. Open your browser and navigate to: `http://localhost:3001`

## Deployment (Netlify)
This application is fully compatible with Netlify. Because it does not require a backend build step, you can simply connect your GitHub repository to Netlify, leave the "Build Command" and "Publish directory" fields blank, and deploy instantly!
