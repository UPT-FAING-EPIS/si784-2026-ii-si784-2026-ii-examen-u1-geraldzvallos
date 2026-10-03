FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY public ./public
COPY database ./database
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
USER node
CMD ["node", "--no-warnings", "src/server.js"]
