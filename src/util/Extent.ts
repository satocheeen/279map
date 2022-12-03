import { Point } from "gpxparser";

export default class Extent {
    _lon1: number | undefined;
    _lat1: number | undefined;
    _lon2: number | undefined;
    _lat2: number | undefined;

    constructor(ext?: [number, number, number, number]) {
        if (ext) {
            this._lon1 = ext[0];
            this._lat1 = ext[1];
            this._lon2 = ext[2];
            this._lat2 = ext[3];
        }
    }

    spread(segment: Point) {
        if (this._lat1 === undefined || this._lat1 > segment.lat) {
            this._lat1 = segment.lat;
        }
        if (this._lon1 === undefined || this._lon1 > segment.lon) {
            this._lon1 = segment.lon;
        }
        if (this._lat2 === undefined || this._lat2 < segment.lat) {
            this._lat2 = segment.lat;
        }
        if (this._lon2 === undefined || this._lon2 < segment.lon) {
            this._lon2 = segment.lon;
        }
    }

    get wkt() {
        return `POLYGON((${this._lon1} ${this._lat1},${this._lon1} ${this._lat2},${this._lon2} ${this._lat2},${this._lon2} ${this._lat1},${this._lon1} ${this._lat1}))`
    }
}