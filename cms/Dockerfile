FROM node:20-alpine

WORKDIR /app

COPY cms/package*.json ./
RUN npm install

COPY cms/ ./

EXPOSE 3001

CMD ["npm", "run", "dev", "--", "--host"]
