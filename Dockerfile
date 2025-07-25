FROM oven/bun:1.2.17

WORKDIR /app

COPY bun.lock .

COPY package.json .

COPY packages/frontend/package.json frontend/package.json

ENV NODE_ENV=development

RUN bun install --ignore-scripts
