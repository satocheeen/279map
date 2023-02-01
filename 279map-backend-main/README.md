# 279map-backend-main
This is the main server of 279map.

## Develop
1. create .env.dev. from sample.
	```shell
	cp .env.dev.sample .env.dev
	```
2. edit .env.dev
3. package install
	```shell
	npm i
	```
4. start developer server.
	```shell
	npm run dev
	```
when you develop with running 279map-docker container, you stop 279map container.

## Deploy
### 279map-api-interface
if you modify 279map-api-interface, you need to build for 279map-core.
```
cd 279map-api-interface
npm run rollup
``` 

### 279map-backend-main
1. delete exist docker image `279map-backend-main`
2. make docker image
	```shell
	docker image build -t 279map-backend-main .
	```
3. make `docker-compose.yml`
