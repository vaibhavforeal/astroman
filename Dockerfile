# Astroman — container image for managed hosting (Render / Railway / Fly).
# Node 24: has the built-in node:sqlite used by the data store.
FROM node:24-bookworm

ENV NODE_ENV=production
WORKDIR /app

# Install production deps first for better layer caching. sweph ships prebuilt
# binaries; this full image also has build tools if a native compile is needed.
COPY package*.json ./
RUN npm ci --omit=dev

# App source
COPY . .

# The persistent disk is mounted here in production (DATA_DIR points at it),
# so the SQLite DB (accounts + saved people) survives redeploys.
ENV DATA_DIR=/data
RUN mkdir -p /data

# The host injects PORT; the app reads process.env.PORT (falls back to 3030).
EXPOSE 3030
CMD ["node", "server/index.js"]
