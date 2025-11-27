# Mood Journal - Project Overview

## Introduction
This is a **full-stack mood journal application** designed to help users track their daily thoughts and feelings. It leverages Artificial Intelligence to analyze the sentiment of the user's notes, providing insights into their mood patterns over time.

## Key Features
- **Daily Journaling**: Users can write and save notes for each day.
- **AI Mood Analysis**: The application uses Google's Gemini AI to analyze the content of the journal entries. It provides:
    - A mood score.
    - A summary of the day/week.
    - Highlights and advice.
- **Real-time Interaction**: Includes features like typing indicators to show activity.
- **Secure Authentication**: Users can securely register and log in to access their private journals.

## Technology Stack (High Level)
- **Frontend (User Interface)**: Built with **React**, a popular library for building dynamic web pages. It uses **Chakra UI** for a modern look and feel.
- **Backend (Server & Database)**: Built with **Laravel**, a robust PHP framework. It handles data storage, security, and communication with the AI.
- **AI Service**: Integrates with **Google Gemini** for intelligent text analysis.
- **Real-time Service**: Uses a separate **Node.js** service with **gRPC** for fast, real-time updates.

## Who is this for?
This project is for developers looking to understand how to integrate modern AI tools with a traditional web stack (Laravel + React) and how to handle real-time data flows in a microservices-like architecture.
