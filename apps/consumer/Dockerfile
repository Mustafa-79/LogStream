FROM node:20-alpine

WORKDIR /usr/src/app

COPY ./consumer/package*.json ./
RUN npm install --include=dev

COPY ./consumer/. .

RUN npm run build

EXPOSE 3002  

CMD ["npm", "start"]