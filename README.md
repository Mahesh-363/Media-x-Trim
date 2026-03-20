# Media X Trim ⚡
<img width="1919" height="915" alt="Screenshot 2026-03-20 100814" src="https://github.com/user-attachments/assets/932d9796-0a5c-400b-8b02-ca3100e31d7f" />


> Free, no-login media converter and video downloader — built for speed, simplicity, and real-world use.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=flat&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Celery](https://img.shields.io/badge/Celery-37814A?style=flat&logo=celery&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)

---

## 🔗 Live Demo

**[mediaxtrim.vercel.app](https://mediaxtrim.vercel.app)** — Try it live, no account needed.

---

## 🚀 What it does

**Media X Trim** lets you:

- 🎬 **Convert** any video, audio, or image file to 40+ formats (MP4, MKV, MP3, WAV, PNG, WEBP and more)
- 📥 **Download** videos from YouTube, Instagram, TikTok, Facebook, Snapchat, Twitter/X, Vimeo and **1000+ platforms**
- 🔒 No sign-up, no ads, no dark patterns — completely free
- 🗑️ All files auto-deleted from the server after 30 minutes

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Django + Django REST Framework | REST API |
| Celery | Async task queue (file processing) |
| Redis (Upstash) | Celery message broker |
| FFmpeg | Video / audio / image conversion |
| yt-dlp | Video downloading from 1000+ platforms |
| PostgreSQL (Supabase) | Database (job records) |
| Cloudflare R2 | File storage (converted/downloaded files) |
| Gunicorn | Production WSGI server |

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite + TypeScript | Frontend framework |
| Syne + JetBrains Mono | Typography |
| Axios | API communication |
| React Dropzone | File upload UX |

### Deployment
| Service | What runs there |
|---|---|
| Render (Web Service) | Django API |
| Render (Background Worker) | Celery worker |
| Vercel | React frontend |
| Upstash | Managed Redis |
| Supabase | Managed PostgreSQL |
| Cloudflare R2 | File storage (free tier) |

---

## ⚙️ Architecture

''
User (Browser)
      │
      ▼
React Frontend (Vercel)
      │
      ▼
Django REST API (Render)
      │
      ├──► Celery Worker (Render) ◄── Redis (Upstash)
      │         │
      │         ├──► FFmpeg (converts files)
      │         └──► yt-dlp (downloads videos)
      │                   │
      │                   ▼
      │            Cloudflare R2 (file storage)
      │
      ▼
PostgreSQL (Supabase) — stores job records
``

**How a conversion works:**
1. User uploads a file → Django saves it to temp storage
2. Django creates a `Job` record in PostgreSQL and returns a `job_id`
3. Celery worker picks up the task and runs FFmpeg
4. Output file is uploaded to Cloudflare R2
5. Frontend polls `/api/jobs/<id>/` every 2 seconds
6. When status = `done`, a download link appears
7. File is deleted from R2 after 30 minutes

---

## 🏃 Running locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- FFmpeg installed and in PATH
- Docker Desktop (for Redis)

### Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux

pip install -r requirements.txt

cp .env.example .env

python manage.py migrate
python manage.py runserver
```

### Start Redis

```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

### Start Celery worker

```bash
cd backend
venv\Scripts\activate
celery -A convertx worker --loglevel=info --pool=solo
```

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/convert/` | Upload file + output format |
| `POST` | `/api/download/` | Provide URL + quality |
| `GET` | `/api/jobs/<id>/` | Poll job status |
| `GET` | `/api/formats/` | List all supported formats |
| `GET` | `/api/file/<filename>/` | Download output file |

---

## 🌍 Deployment (all free)

| Step | Service | Link |
|---|---|---|
| Database | Supabase | supabase.com |
| Redis | Upstash | upstash.com |
| File Storage | Cloudflare R2 | cloudflare.com |
| Backend | Render | render.com |
| Frontend | Vercel | vercel.com |

---

## 👨‍💻 Author

**Uma Mahesh** — Full Stack & Backend Engineer

- 📍 Visakhapatnam, India  
- 🐙 GitHub: [@Mahesh-363](https://github.com/Mahesh-363)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

> ⚠️ **Disclaimer:** Video downloading is for personal use only. Always respect platform terms of service.
