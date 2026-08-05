FROM node:20-alpine

WORKDIR /app

# Install dependencies first so this layer is cached unless package*.json changes.
# Uses npm ci (reproducible, exact versions) once package-lock.json exists;
# falls back to npm install until then so this doesn't break in the meantime.
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Then bring in the rest of the backend source
COPY . .

ENV NODE_ENV=production
EXPOSE 3001

# server.js awaits initDb() before listening, so the container only reports
# "up" once the schema migration has actually completed against DATABASE_URL.
CMD ["node", "server.js"]
