# 279map-common
This is used by 279map.
There are the modules which are used by both of frontend and backend.

279mapにて共通的に使用する資源を管理しています。

```mermaid
flowchart RL
	subgraph frontend
		subgraph 279map-core
			279map-common-core["279map-common"]
		end
		279map-frontend -. use .-> 279map-core
	end

	subgraph backend
		db[("279map-db")]

		subgraph 279map-backend-main
			api-interface["api-interface (private)"]
		end

		subgraph 279map-backend-common
			279map-common-backend["279map-common"]
		end

		279map-backend-main <--> odba
		279map-backend-main <--> db
		odba <--> db
		fs["fs (option)"] <--> 279map-backend-main
		fs <--> odba
		279map-backend-main -. use .-> 279map-backend-common
		odba -. use .-> 279map-backend-common
		fs -. use .-> 279map-backend-common
	end
	279map-core -.-> api-interface
	original-db[("Original DB")] <--> odba
	
	style 279map-common-core fill:#faa, stroke:#f55
	style 279map-common-backend fill:#faa, stroke:#f55
```

## Deploy
```
npm run deploy
```
The current sources deploy to 279map-backend-common and 279map-core.

279map-backend-commonと279map-coreに、最新資源が配置されます。
