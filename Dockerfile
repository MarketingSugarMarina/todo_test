# ── Stage 1: Build ────────────────────────────────────────────
# ใช้ Node.js 20 Alpine เพื่อให้ image เล็ก
FROM node:20-alpine AS builder

WORKDIR /app

# copy เฉพาะ package files ก่อน เพื่อให้ Docker cache layer นี้ได้
# (ถ้าโค้ดเปลี่ยนแต่ dependencies ไม่เปลี่ยน จะไม่ npm install ซ้ำ)
COPY package*.json ./

# ติดตั้งเฉพาะ production dependencies
RUN npm ci --omit=dev

# ── Stage 2: Production ───────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# copy node_modules จาก builder stage
COPY --from=builder /app/node_modules ./node_modules

# copy source code
COPY . .

# Railway inject PORT มาให้ผ่าน environment variable
# ประกาศ EXPOSE เป็น hint (ไม่ได้ผูก port จริง)
EXPOSE 3000

# รัน server
CMD ["node", "server.js"]
