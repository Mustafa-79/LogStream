FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Make the startup script executable
RUN chmod +x start.sh

CMD ["sh", "start.sh"]