FROM oven/bun:1.2.17

WORKDIR /app

COPY bun.lock .

COPY package.json .

RUN bun install --frozen-lockfile
