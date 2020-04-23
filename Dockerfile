FROM node:10.9-alpine

ENV PORT 3000
EXPOSE 3000

WORKDIR /usr/src/app
COPY package.json .
RUN npm install
COPY . .

CMD npm start