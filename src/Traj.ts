import chroma from 'chroma-js';
import turfBezierSpline from '@turf/bezier-spline';
import { lineString } from '@turf/turf';
import turfCircle from '@turf/circle';

export class Traj {
    private _pointList: { lng: number, lat: number }[] = [];
    private _interPolationPointList: { lng: number, lat: number }[] = [];
    private _color: string = '#222';
    private _isTimeEcode: boolean = false;
    private _isInterpolation: boolean = false;
    private _interpolationReductionRate: number = 0.0;
    private _vis: boolean = true;

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

    public set isTimeEncode(flag: boolean) {
        this._isTimeEcode = flag;
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

    public set vis(flag: boolean) {
        this._vis = flag;
    }

    public feature(): object {
        if (this._vis) {
            let coordinates: number[][] = this._pointList.map((point) => [point.lng, point.lat]);

            // ベジェ補間
            if (this._isInterpolation && coordinates.length > 1) {
                // const option = { resolution: 50000 };
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

            if (this._isTimeEcode) {
                let features: any = [];
                for (let i = 0; i < coordinates.length - 1; i++) {
                    const c0 = coordinates[i];
                    const c1 = coordinates[i + 1];

                    let hsv: number[] = chroma(this._color).hsv();
                    // 無彩色のときは明度のグラデーション
                    let s = hsv[1];
                    let v = 1 - i / (coordinates.length - 1);
                    // 彩色のときはサイドのグラデーション
                    if (s !== 0) {
                        s = i / (coordinates.length - 1);
                        v = hsv[2];
                    }
                    let h = !hsv[0] ? 0 : hsv[0];


                    features.push({
                        'type': 'Feature',
                        'properties': {
                            'color': chroma.hsv(h, s, v).name()
                        },
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': [c0, c1]
                        }
                    });
                }
                return features;

            } else {
                return {
                    'type': 'Feature',
                    'properties': {
                        'color': chroma(this._color).name()
                    },
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': coordinates
                    }
                };
            }
        } else {
            return {};
        }
    }

    public circles(radius: number): any {
        if (this._vis) {
            return this.pointList.map(point => {
                let center: number[] = [point.lng, point.lat];
                return turfCircle(center, radius, { steps: 64, units: 'degrees' });
            });
        } else {
            return [];
        }
    }

    public dump() {
        console.log(this._pointList);
    }
}