FROM node:20-alpine

WORKDIR /usr/src/app

COPY ./api-gateway/package*.json ./

RUN npm install --include=dev

COPY ./api-gateway/. .

RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
