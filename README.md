# 279map-backend-main
This is the main server of 279map.

## Package Configuration
```mermaid
flowchart LR
	279map-common
	subgraph frontend
		279map-core
		279map -. use .-> 279map-core
	end
	subgraph backend
		db[("cache db")]
		279map-backend-common
		279map-backend-main <--> odba
		279map-backend-main <--> db
		odba <--> db
		fs["fs (option)"] <--> 279map-backend-main
		fs <--> odba
		279map-backend-main -. use .-> 279map-backend-common
		odba -. use .-> 279map-backend-common
		fs -. use .-> 279map-backend-common
	end
	frontend -. use .-> 279map-common
	backend -. use .-> 279map-common
	279map-core <-- https,wss --> 279map-backend-main

    style 279map-backend-main fill:#faa, stroke:#f55
```

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
1. delete exist docker image `279map-backend-main`
2. make docker image
	```shell
	docker image build -t 279map-backend-main .
	```
3. make `docker-compose.yml`
