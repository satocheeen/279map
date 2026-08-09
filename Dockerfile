# backend-main image build
# 1. build stage
FROM node:22-bookworm-slim as build

WORKDIR /home/node/app

# backend-main
COPY backend-main ./backend

# backend-api
COPY backend-api ./backend-api

WORKDIR /home/node/app/backend

# -- install latest npm package
RUN npm install

RUN npm run build

WORKDIR /home/node/app/backend/dist
RUN npm init -y
RUN npm install --platform=linuxmusl --arch=x64 sharp


# 2. deploy stage
FROM alpine:3.22

RUN apk add --no-cache nodejs~=22

# -- setup ca-certificates
RUN apk add --no-cache ca-certificates
COPY backend-main/dev/cert.pem /etc/ssl/certs/ca-certificates.crt
RUN update-ca-certificates

COPY --from=build /home/node/app/backend/dist /var/www

RUN mkdir /var/www/graphql
COPY --from=build /home/node/app/backend/src/graphql/*.gql /var/www/graphql

COPY --from=build /home/node/app/backend/public /var/www/public

RUN mkdir /var/log/www
RUN chmod 777 /var/log/www

RUN mkdir /var/session
RUN chmod 777 /var/session

EXPOSE 80
EXPOSE 8083

WORKDIR /var/www
CMD ["node", "/var/www/main.js"]
