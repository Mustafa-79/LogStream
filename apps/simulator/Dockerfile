FROM node:20-alpine

WORKDIR /usr/src/app

COPY ./simulator/package*.json ./
RUN npm install --include=dev

COPY ./simulator .

# Make the startup script executable
RUN chmod +x start.sh

CMD ["sh", "start.sh"]