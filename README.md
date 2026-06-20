# Game Leaderboard API 🎮

[![CI](https://github.com/<your-username>/game-leaderboard-api/actions/workflows/ci.yml/badge.svg)](https://github.com/<your-username>/game-leaderboard-api/actions/workflows/ci.yml)

Real-time Game Leaderboard API built with **Node.js (Express)** and **Redis Sorted Sets** — hiệu suất cao, phù hợp cho game mobile/web với hàng triệu người chơi.

## ✨ Tính năng nổi bật

- **Real-time leaderboard** — cập nhật điểm và tra cứu thứ hạng tức thì (O(log N))
- **Redis Sorted Sets (ZSET)** — cấu trúc dữ liệu tối ưu cho bảng xếp hạng
- **Layered Architecture** — phân lớp rõ ràng (Routes → Controllers → Config)
- **Input Validation** — Joi schema validation cho tất cả endpoints
- **Error Handling tập trung** — không crash server, trả về JSON chuẩn
- **Rate Limiting** — bảo vệ API khỏi abuse (100 requests / 15 phút)
- **CORS** — hỗ trợ cross-origin requests
- **Request Logging** — Morgan + Winston (console + file)
- **Swagger / OpenAPI Docs** — tài liệu API tự động tại `/api-docs`
- **Docker Compose** — chạy Redis + Node chỉ với 1 lệnh
- **Health Check** — endpoint `/health` kiểm tra Redis + uptime
- **Graceful Shutdown** — đóng kết nối Redis khi tắt server
- **CI Pipeline** — GitHub Actions tự động test + lint khi push

## 🏗 Kiến trúc thư mục

```
game-leaderboard-api/
├── .env.example               # Mẫu biến môi trường
├── .env                       # Biến môi trường (git-ignored)
├── .gitignore
├── package.json               # Dependencies & scripts
├── Dockerfile                 # Build image production
├── docker-compose.yml         # Redis + API (1 lệnh chạy)
├── .github/workflows/ci.yml   # CI Pipeline
├── logs/                      # Log files (git-ignored)
├── tests/
│   └── rankController.test.js # Integration tests (Jest + Supertest)
└── src/
    ├── app.js                 # Entry point — khởi tạo Express & kết nối các thành phần
    ├── config/
    │   ├── redis.js           # Kết nối Redis (ioredis, lazyConnect, retry)
    │   └── logger.js          # Winston logger (console + file)
    ├── controllers/
    │   └── rankController.js  # Xử lý nghiệp vụ leaderboard
    ├── middlewares/
    │   ├── errorHandler.js    # Global error handler
    │   ├── validate.js        # Joi validation middleware
    │   └── rateLimiter.js     # Rate limiting
    ├── validators/
    │   └── rankValidator.js   # Joi schemas
    ├── routes/
    │   ├── rankRoutes.js      # API routes leaderboard (+ validation)
    │   └── healthRoutes.js    # Health check endpoint
    └── docs/
        └── swagger.js         # Swagger/OpenAPI spec
```

## 🚀 Cài đặt & Chạy

### Yêu cầu
- **Node.js** >= 18
- **Redis** server (hoặc Docker)

### Option 1: Chạy local

```bash
# 1. Clone & cd vào project
git clone https://github.com/bchhngsaygez/game-leaderboard-api.git
cd game-leaderboard-api

# 2. Cài dependencies
npm install

# 3. Copy env
cp .env.example .env

# 4. Chạy Redis
docker run -d -p 6379:6379 redis:alpine

# 5. Khởi động server
npm run dev    # dev mode — nodemon auto-restart
# hoặc
npm start      # production

# 6. Mở Swagger docs
# http://localhost:3000/api-docs
```

### Option 2: Docker Compose (khuyên dùng) 🐳

```bash
docker compose up -d
# API: http://localhost:3000
# Swagger: http://localhost:3000/api-docs
```

## 📡 API Endpoints

### 1. Cập nhật / thêm điểm người chơi

```
POST /api/v1/ranks/score
Content-Type: application/json

{
  "userId": "player1",
  "score": 1500
}
```

**Logic:** Dùng `ZADD` với option `GT` — chỉ cập nhật nếu điểm mới **cao hơn** điểm cũ.

**Response (200):**
```json
{
  "success": true,
  "message": "Score updated successfully",
  "data": { "userId": "player1", "score": 1500 }
}
```

### 2. Lấy Top N người chơi

```
GET /api/v1/ranks/top?limit=10
```

**Logic:** Dùng `ZREVRANGE ... WITHSCORES` — lấy danh sách từ cao xuống thấp.

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "rank": 1, "userId": "player1", "score": 1500 },
    { "rank": 2, "userId": "player2", "score": 1200 }
  ]
}
```

### 3. Tra cứu hạng của 1 người chơi

```
GET /api/v1/ranks/user/:userId
```

**Logic:** Dùng `ZREVRANK` (cộng 1 vì Redis trả index từ 0) + `ZSCORE`.

**Response (200):**
```json
{
  "success": true,
  "data": { "userId": "player1", "rank": 1, "score": 1500 }
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "User \"unknown\" not found in leaderboard"
}
```

### 4. Health Check

```
GET /health
```

Kiểm tra trạng thái server và Redis connection.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "uptime": 123.45,
    "timestamp": "2026-06-20T17:00:00.000Z",
    "redis": "connected"
  }
}
```

### 5. Swagger Docs

```
GET /api-docs
```

Giao diện Swagger UI — xem và test tất cả endpoints trực tiếp từ trình duyệt.

## 🧪 Chạy Tests

```bash
# Yêu cầu Redis đang chạy (localhost:6379)
npm test

# Watch mode
npm run test:watch
```

Tests sử dụng **Jest** + **Supertest** — integration test với Redis thật. Mỗi lần chạy tự động flush dữ liệu để đảm bảo sạch sẽ.

## 🧠 Công nghệ sử dụng

| Technology | Mục đích |
|------------|----------|
| **Express** | Web framework cho REST API |
| **ioredis** | Redis client mạnh mẽ, hỗ trợ Promise, Cluster, Sentinel |
| **Redis Sorted Sets** | Lưu leaderboard với độ phức tạp O(log N) |
| **Joi** | Input validation |
| **Swagger** | OpenAPI documentation |
| **Winston + Morgan** | Request logging |
| **express-rate-limit** | Rate limiting |
| **cors** | Cross-Origin Resource Sharing |
| **Jest + Supertest** | Integration testing |
| **Docker Compose** | Container orchestration |
| **GitHub Actions** | CI/CD |

## 📂 Biến môi trường

| Variable | Default | Mô tả |
|----------|---------|-------|
| `PORT` | `3000` | Cổng chạy server |
| `REDIS_HOST` | `127.0.0.1` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | _(empty)_ | Redis password |
| `LOG_LEVEL` | `info` | Level log (debug, info, warn, error) |

## 🐳 Docker

```bash
# Build image
docker build -t game-leaderboard-api .

# Chạy với Docker Compose (gồm Redis)
docker compose up -d

# Xem logs
docker compose logs -f api

# Dừng
docker compose down
```

## 📈 Hiệu năng

Redis Sorted Sets cung cấp độ phức tạp:

| Operation | Complexity |
|-----------|------------|
| `ZADD` (thêm/cập nhật) | **O(log N)** |
| `ZREVRANK` (tra hạng) | **O(log N)** |
| `ZREVRANGE` (lấy top N) | **O(log N + N)** |
| `ZSCORE` (lấy điểm) | **O(1)** |

Với N = 1 triệu người chơi, mỗi thao tác chỉ mất **microseconds**.

## 📄 License

MIT
