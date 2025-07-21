FROM node:20-alpine

WORKDIR /usr/src/app

COPY ./producer/package*.json ./    
RUN npm install --include=dev

COPY ./producer .

EXPOSE 3001

CMD ["npm", "start"]