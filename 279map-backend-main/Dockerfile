# 1. build stage
FROM node:18.17 as build

WORKDIR /home/node/app/backend
COPY . .

WORKDIR /home/node/app/backend

# -- install latest npm package
RUN npm install

RUN npm run build

WORKDIR /home/node/app/backend/dist
RUN npm init -y
RUN npm install --platform=linuxmusl --arch=x64 sharp

# 2. deploy stage
FROM alpine:3.18

RUN apk add --no-cache nodejs~=18
# -- setup ca-certificates
RUN apk add --no-cache ca-certificates
COPY ./dev/cert.pem /etc/ssl/certs/ca-certificates.crt
RUN update-ca-certificates

COPY --from=build /home/node/app/backend/dist /var/www
RUN mkdir /var/www/graphql
COPY --from=build /home/node/app/backend/src/graphql/*.gql /var/www/graphql

RUN mkdir /var/log/www
RUN chmod 777 /var/log/www

RUN mkdir /var/session
RUN chmod 777 /var/session

EXPOSE 80
EXPOSE 8083

WORKDIR /var/www
CMD ["node", "/var/www/main.js"]
