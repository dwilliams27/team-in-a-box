FROM node:18-alpine

WORKDIR /app

COPY ./apps/brain/package.json ./
RUN npm i

COPY ./apps/brain/ .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
