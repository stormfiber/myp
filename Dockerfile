FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    ffmpeg \
    libvips-dev \
    python3 \
    make \
    g++ \
    && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /app

COPY package.json .

RUN git config --global http.sslVerify false && \
    git config --global url."https://github.com/".insteadOf "ssh://git@github.com/" && \
    npm install --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "--max-old-space-size=220", "index.js"]
