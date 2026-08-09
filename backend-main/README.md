# 279map-backend-main
This is the main server of 279map.

```mermaid
flowchart LR
	subgraph frontend
    core
	end

	subgraph backend
		db[("cache db")]
		backend-main

		backend-main <--> odba["backend-odba"]
		odba-."use".->backend-api
		backend-main-."use".->backend-api

		db -.read.-> backend-main
		odba -.insert.-> db
	end
	core <--> backend-main
	original-db[("Original DB")] <--> odba

	style backend-main fill:#faa, stroke:#f55
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
### 279map-backend-main
1. make docker image
	```shell
	docker image build -t 279map-backend-main .
	```
