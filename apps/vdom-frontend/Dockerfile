FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the frontend (adjust if your build command is different)
RUN npx ojet build --release

# Serve static files with a simple server
RUN npm install -g serve

EXPOSE 8000

CMD ["npx", "ojet", "serve"]