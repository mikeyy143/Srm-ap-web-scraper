# SRM Attendance Scraper

A modern Next.js web application for fetching SRM student portal attendance with automated captcha solving using a trained CRNN ML model.

## ✨ Features

- 🔑 **Automated Login** - Secure credential handling with automatic session management
- 🤖 **Smart Captcha Solving** - ML-powered CRNN model via Python FastAPI



**Request:**
```json
{
  "username": "your_registrationNumber",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "attendanceData": [
    {
      "subjectCode": "CSE101",
      "subjectName": "Data Structures",
      "present": "42",
      "absent": "2",
      "od": "1"
    }
  ],
  "captchaInfo": "Captcha solved as: ABCD12"
}
```


**Tech Stack:**
- Framework: Next.js 15, React 19
- Web Scraping: Puppeteer, Cheerio
- HTTP Client: node-fetch
- Styling: Custom CSS


**Production Notes:**
- Use HTTPS/SSL certificates
- Store sensitive config in `.env.production.local`
- Add rate limiting to `/api/scrape`
- All inputs validated server-side


**How to run:**
 -cd SRMAP-Hybrid-CaptchSolver
 -python api.py
 -cd Srm-ap-web-scraper
 -npm run dev

## Important

- Passwords sent securely (HTTPS in production)
- Session managed automatically via JSESSIONID
- Requires trained ONNX model for captcha solving
- Rate limit API requests to avoid blocking




