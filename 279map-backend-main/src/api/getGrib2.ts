import { GetGrib2Param, GetGrib2Result } from "../../279map-api-interface/src";
import { CurrentMap } from "../../279map-backend-common/src";

export async function getGrib2({ param, currentMap }: {param:GetGrib2Param; currentMap: CurrentMap}): Promise<GetGrib2Result> {
    return {
        datetime: '2021-08-13 14:00:00',
        gridBy: {
            lat: 0.008333,
            lon: 0.012500,
        },
        grids: [
            {
                lat: 36.0046,
                lon: 140.006,
                value: 30,
            },
            {
                lat: 36.0046,
                lon: 140.019,
                value: 30,
            }
        ]
    }
}