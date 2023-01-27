import chroma from 'chroma-js';
import turfBezierSpline from '@turf/bezier-spline';
import { lineString } from '@turf/turf';

export class Traj {
    private _pointList: { lng: number, lat: number }[] = [];
    private _interPolationPointList: { lng: number, lat: number }[] = [];
    private _color: string = '#ddd';
    private _isInterpolation: boolean = false;
    private _interpolationReductionRate: number = 0.0;

    constructor() {

    }

    public add(point: { lng: number, lat: number }) {
        this._pointList.push(point);
    }

    public get pointList() {
        return this._pointList;
    }
    public set pointList(ps: { lng: number, lat: number }[]) {
        this._pointList = ps;
    }

    public set color(c: string) {
        this._color = c;
    }

    public get color() {
        return this._color;
    }

    public set isInterpolation(flag: boolean) {
        this._isInterpolation = flag;
    }

    public get interPolationPointList() {
        return this._interPolationPointList;
    }

    public set interpolationReductionRate(rate: number) {
        this._interpolationReductionRate = rate;
    }

    public feature(): object {
        let coordinates: number[][] = this._pointList.map((point) => [point.lng, point.lat]);

        // ベジェ補間
        if (this._isInterpolation && coordinates.length > 1) {
            coordinates = turfBezierSpline(lineString(coordinates)).geometry.coordinates;
            let delta: number = Math.floor(coordinates.length * this._interpolationReductionRate) + 1;
            let tmp: number[][] = [];
            tmp.push(coordinates[0]);
            for (let i = 0; i < coordinates.length; i += delta) {
                tmp.push(coordinates[i]);
            }
            tmp.push(coordinates[coordinates.length - 1]);
            coordinates = tmp;
            this._interPolationPointList = coordinates.map((point: number[]) => {
                return { lng: point[0], lat: point[1] };
            });
        }

        return {
            'type': 'Feature',
            'properties': {
                'color': chroma(this._color).alpha(0.9).css()
            },
            'geometry': {
                'type': 'LineString',
                'coordinates': coordinates
            }
        };
    }

    public dump() {
        console.log(this._pointList);
    }
}