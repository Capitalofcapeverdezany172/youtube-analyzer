# 🎬 YouTube Channel Analyzer

> Phân tích sơ bộ bất kỳ kênh YouTube nào - viral topics, title formulas, viewer persona, publishing patterns.

![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)
![YouTube API](https://img.shields.io/badge/YouTube%20Data%20API-v3-FF0000?logo=youtube&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?logo=google&logoColor=white)

## ✨ Features

| Tab | Mô tả |
|-----|-------|
| **Tổng Quan** | Top 10 viral videos, 6 stat cards (tổng views, median, avg, max, min) |
| **AI Insights** | Nhóm chủ đề viral (fire rating), chân dung người xem, strategic insights |
| **Formulas** | Công thức tiêu đề hiệu quả + ví dụ thực tế |
| **Patterns** | Tần suất đăng, best posting day, quarterly trend, performance gap |
| **Tất Cả Videos** | Full table - sortable, searchable, paginated |

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/youtube-analyzer.git
cd youtube-analyzer
npm install
```

### 2. API Keys

Bạn cần 2 API keys:

| Key | Lấy ở đâu | Free quota |
|-----|-----------|------------|
| YouTube Data API v3 | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | 10,000 units/ngày |
| Google Gemini | [Google AI Studio](https://aistudio.google.com/apikey) | 15 req/phút |

```bash
cp .env.example .env
```

Sửa file `.env`:

```env
YOUTUBE_API_KEY=your_youtube_key_here
GEMINI_API_KEY=your_gemini_key_here
```

### 3. Run

```bash
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173)

> **Tip:** Nếu gặp lỗi memory với `npm run dev`, chạy riêng 2 server:
> ```bash
> node server/server.js     # Terminal 1
> npx vite                  # Terminal 2
> ```

## 📁 Project Structure

```
├── server/
│   ├── server.js          # Express API proxy
│   ├── youtube-api.js     # YouTube Data API v3 wrapper
│   └── ai-analyzer.js     # Gemini structured prompt
├── src/
│   ├── index.html         # Main HTML
│   ├── style.css          # Design system (glassmorphism)
│   ├── main.js            # App logic, routing, tabs
│   ├── utils/format.js    # Number/date formatting
│   └── components/        # 5 tab renderers
├── .env.example
├── package.json
└── vite.config.js
```

## 🔧 How It Works

1. Nhập `@handle` hoặc URL kênh YouTube
2. Backend fetch toàn bộ video data qua YouTube Data API v3 (paginated)
3. Frontend tính stats, render top videos, patterns (tần suất, best day, trends)
4. Gemini AI phân tích: nhóm chủ đề, công thức tiêu đề, chân dung người xem

## ⚠️ Quota

- Mỗi lần phân tích tốn ~200-500 YouTube API units (tùy số videos)
- Free tier cho phép ~20-50 kênh/ngày
- Gemini free tier: 15 requests/phút

## 📝 License

MIT

---

**Made by [Minh Đỗ](https://zalo.me/g/igkywu632)**
