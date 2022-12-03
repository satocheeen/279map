# 1. build stage
FROM node:16.13 as build

# -- backend
WORKDIR /home/node/app/backend
COPY . .
WORKDIR /home/node/app/backend
RUN yarn install
RUN yarn build
WORKDIR /home/node/app/backend/dist
RUN npm init -y
RUN npm install --platform=linuxmusl --arch=x64 sharp

# 2. deploy stage
FROM alpine:latest

RUN apk add --no-cache nodejs
COPY --from=build /home/node/app/backend/dist /var/www

RUN mkdir /var/log/www
RUN chmod 777 /var/log/www

EXPOSE 80
EXPOSE 8083

WORKDIR /var/www
CMD ["node", "/var/www/main.js"]
