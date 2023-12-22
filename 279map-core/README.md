# 279map-core
This is used in 279map.
279map-core connects to 279map server and provides basic features of 279map.
if you want to make originai UI map, you can use 279map-core.

```mermaid
flowchart RL
	subgraph frontend
		subgraph 279map-core
		end
		279map-frontend -. use .-> 279map-core
	end

	subgraph backend
		db[("279map-db")]

		subgraph 279map-backend-main
			api-interface["api-interface (private)"]
		end

		subgraph 279map-backend-common
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
	
	style 279map-core fill:#faa, stroke:#f55
```

## How to use
if you want to make originai UI map, you can use 279map-core.

```javascript
// you need load jsts cdn
import 'https://unpkg.com/jsts@2.6.1/dist/jsts.min.js';

const props = {
    mapServerHost: 'localhost',
    mapId: 'test',
    iconDefine: [
        {
            id: 'pin',
            imagePath: '/icon/pin.png',
            useMaps: ['Real', 'Virtual'],
        },
        {
            id: 'school',
            imagePath: '/icon/house.png',
            useMaps: ['Virtual'],
        },
    ],
};

return (
	<TsunaguMap {...props}  />
)
```

→show [API References](documents/API.md)

## 279map compatiblity
|  279map-core  |  279map-main-backend  |
| ---- | ---- |
|  0.5.6  |  0.46.5  |
|  0.5.5 |  0.46.4  |


## Supplement
- if you use on Next.js, set  `swcMinify: false` in next.config.js.  279map use OpenLayers and it can't run when `swcMinify: true`.

## Copyright
Copyright (c) 2022 satocheeen.com

Released under the MPL-2.0 license

https://www.mozilla.org/en-US/MPL/2.0/
