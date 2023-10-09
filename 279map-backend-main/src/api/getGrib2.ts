import { GetGrib2Param, GetGrib2Result } from "../../279map-api-interface/src";
import { CurrentMap } from "../../279map-backend-common/src";

export async function getGrib2({ param, currentMap }: {param:GetGrib2Param; currentMap: CurrentMap}): Promise<GetGrib2Result> {
    return {
        gridDefine: {
            lat: {
                from: 36.004645,
                to: 36.996272,
                by: 0.008333,
            },
            lon: {
                from: 140.003250,
                to: 140.993750,
                by: 0.012500,
            }
        },
        gridsByTime: [
            {
                datetime: '2021-08-13 14:00:00',
                grids: [
                    {
                        lat: 140.006,
                        lon: 36.0046,
                        value: 30,
                    },
                    {
                        lat: 140.019,
                        lon: 36.0046,
                        value: 30,
                    }
                ]
            }
        ]
    }
}