# 1. build stage
FROM node:16.13 as build

WORKDIR /home/node/app/backend
COPY . .

WORKDIR /home/node/app/backend

# -- install latest npm package
RUN npm install
RUN npm i -D 279map-common@npm:279map-common
RUN npm i 279map-backend-common@npm:279map-backend-common

RUN npm run build

WORKDIR /home/node/app/backend/dist
RUN npm init -y
RUN npm install --platform=linuxmusl --arch=x64 sharp

# 2. deploy stage
FROM alpine:latest

RUN apk add --no-cache nodejs
# -- setup ca-certificates
RUN apk add --no-cache ca-certificates
COPY ./dev/cert.pem /etc/ssl/certs/ca-certificates.crt
RUN update-ca-certificates

COPY --from=build /home/node/app/backend/dist /var/www

RUN mkdir /var/log/www
RUN chmod 777 /var/log/www

EXPOSE 80
EXPOSE 8083

WORKDIR /var/www
CMD ["node", "/var/www/main.js"]
