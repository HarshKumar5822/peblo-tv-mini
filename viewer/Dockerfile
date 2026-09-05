FROM node:20-alpine

WORKDIR /app

COPY viewer/package.json ./
RUN npm install

COPY viewer/ ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
