FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Install ts-node globally (optional, but common for dev tools)
RUN npm install -g ts-node typescript

CMD ["npx", "ts-node", "index.ts"]