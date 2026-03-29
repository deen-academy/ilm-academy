# 🕌 ILM Academy — Islamic Learning Platform

A scalable, modern Islamic education platform designed to teach Deen from Maktab level to advanced studies.

---

## 🚀 Overview

ILM Academy is a full-stack learning platform built to deliver structured Islamic education including:

* Qur'an reading
* Tajweed
* Arabic basics
* Aqeedah
* Fiqh
* Hadith
* Seerah
* Islamic lifestyle & manners

---

## 🧱 Tech Stack

### Frontend

* React (Vite-based setup)
* TypeScript
* Tailwind CSS
* shadcn/ui

### Backend

* Supabase (PostgreSQL + Auth + RLS)

### Hosting & Deployment

* Vercel

### Other Tools

* GitHub (version control)

---

## 🔐 Security

* Row Level Security (RLS) enabled on all tables
* Environment variables used for all secrets
* No API keys stored in repository
* Service role keys restricted to backend functions

---

## 📁 Project Structure

```
src/
 ├── components/
 ├── pages/
 ├── integrations/
 │    └── supabase/
 ├── modules/
 ├── features/
 └── utils/

supabase/
 ├── functions/
 └── migrations/
```

---

## ⚙️ Environment Variables

Create environment variables in your deployment platform:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🧠 Core Features

### 👨‍🎓 Student

* Enroll in courses
* Track progress
* Complete lessons

### 👨‍🏫 Teacher

* Create courses
* Manage modules & lessons

### 🛡️ Admin

* Full system control

---

## 🔄 Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

---

## 🔐 Backend Functions

Supabase Edge Functions are used for:

* Push notifications
* Secure backend operations

---

## 📈 Future Improvements

* Quiz system
* Certificates
* Payments & subscriptions
* Mobile app
* AI-powered learning assistant

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📜 License

This project is private and proprietary.

---

## 🧭 Vision

To build a global platform for authentic Islamic knowledge, accessible to everyone.

---
