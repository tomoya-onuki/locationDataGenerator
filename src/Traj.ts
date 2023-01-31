import chroma from 'chroma-js';
import turfBezierSpline from '@turf/bezier-spline';
import { lineString } from '@turf/turf';
import turfCircle from '@turf/circle';

export class Traj {
    protected _pointList: { lng: number, lat: number }[] = [];
    protected _interPolationPointList: { lng: number, lat: number }[] = [];
    // private _dateList: number[] = [];
    // private _interpolateDateList: number[] = [];
    protected _color: string = '#222';
    protected _isTimeEcode: boolean = false;
    protected _isInterpolation: boolean = false;
    protected _interpolationReductionRate: number = 0.0;
    protected _vis: boolean = true;

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

    // public setDate(idx: number, date: number) {
    //     this._dateList[idx] = date;
    // }

    // public get dateList() {
    //     return this._dateList;
    // }

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

    public get interpolationPointList() {
        return this._interPolationPointList;
    }

    // public get interpolationDateList() {
    //     return this._interpolateDateList;
    // }

    public set interpolationReductionRate(rate: number) {
        this._interpolationReductionRate = rate;
    }

    public set vis(flag: boolean) {
        this._vis = flag;
    }

    public feature(): object {
        if (this._vis) {
            let coordinates: number[][] = this._pointList.map((point) => [point.lng, point.lat]);
            // let datelist: number[] = this._dateList;

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


                // // 日付の補間
                // // 時刻を持つ点間の分割数
                // let div = this._interPolationPointList.length / (this.dateList.length - 1);
                // this._interpolateDateList = [];
                // for (let i = 0; i < this.dateList.length - 1; i++) {
                //     let date0 = this.dateList[i];
                //     let date1 = this.dateList[i + 1];

                //     if (i === this.dateList.length - 2) {
                //         div--;
                //     }

                //     for (let j = 0; j < div; j++) {
                //         let ratio = Math.ceil(j / div * 1000) / 1000;
                //         if (j >= div - 1) {
                //             ratio = 1.0;
                //         }
                //         this._interpolateDateList.push((date1 - date0) * ratio + date0);
                //     }
                // }
                // datelist = this._interpolateDateList;
            }

            // 時刻のグラデーション
            if (this._isTimeEcode) {
                let features: any = [];
                for (let i = 0; i < coordinates.length - 1; i++) {
                    const c0 = coordinates[i];
                    const c1 = coordinates[i + 1];

                    // const date: number = datelist[i];
                    // const beginDate: number = datelist[0];
                    // const endDate: number = datelist[datelist.length - 1];
                    // let ratio: number = (date - beginDate) / (endDate - beginDate);
                    // console.log(ratio);
                    let ratio: number = i / (coordinates.length - 1);
                    let hsv: number[] = chroma(this._color).hsv();
                    // 無彩色のときは明度のグラデーション
                    let s = hsv[1];
                    let v = 1 - ratio;
                    // 彩色のときはサイドのグラデーション
                    if (s !== 0) {
                        s = ratio;
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