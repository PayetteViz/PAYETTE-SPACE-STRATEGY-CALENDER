FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

# SQLite data directory
RUN mkdir -p /app/data
ENV DATABASE_PATH=/app/data/calendar.db

EXPOSE 3000

CMD ["node", "server.js"]
