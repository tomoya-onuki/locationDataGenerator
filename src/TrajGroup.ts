import { Traj } from "./Traj";
import { BaseTraj } from "./BaseTraj";

export class TrajGroup {
    public baseTraj: BaseTraj = new BaseTraj();
    public subTrajList: Traj[] = [];
    private _id: number;
    private _color: string = '#222';
    private _isTimeEncode: boolean = false;


    constructor(i: number) {
        this._id = i;
        this.baseTraj.color = this._color;
    }

    public get id() {
        return this._id;
    }

    public get color(): string {
        return this._color;
    }

    public set color(c: string) {
        this._color = c;
        this.baseTraj.color = c;
        this.subTrajList.forEach(subTraj => subTraj.color = c);
    }

    public set isTimeEncode(flag: boolean) {
        this._isTimeEncode = flag;
        this.baseTraj.isTimeEncode = flag;
        this.subTrajList.forEach(subTraj => subTraj.isTimeEncode = flag);
    }

    public set isInterpolation(flag: boolean) {
        this.baseTraj.isInterpolation = flag;
        this.subTrajList.forEach(subTraj => subTraj.isInterpolation = flag);
    }

    public set interpolationReductionRate(rate: number) {
        this.baseTraj.interpolationReductionRate = rate;
        this.subTrajList.forEach(subTraj => subTraj.interpolationReductionRate = rate);
    }

    public set vis(flag: boolean) {
        this.baseTraj.vis = flag;
        this.subTrajList.forEach(subtraj => subtraj.vis = flag);
    }

    public set visDateForm(flag: boolean) {
        this.baseTraj.visDateForm = flag;
    }


    public generateSubTrajList(N: number, buff: number) {
        const newTrajList: Traj[] = [];
        for (let i = 0; i < N; i++) {
            const newTraj: Traj = new Traj();
            newTraj.color = this._color;
            newTraj.isTimeEncode = this._isTimeEncode;
            newTraj.pointList = this.baseTraj.pointList.map(point => {
                return {
                    lng: point.lng + (Math.random() - 0.5) * buff,
                    lat: point.lat + (Math.random() - 0.5) * buff
                };
            });
            newTrajList.push(newTraj);
        }
        this.subTrajList = newTrajList;
    }

    public clearSubTrajList() {
        this.subTrajList = [];
    }

    public subTrajListFeatures() {
        return this.subTrajList.map(subtraj => {
            return subtraj.feature();
        }).flat();
    }


    public addDateForm(map: mapboxgl.Map, firstDate: string, step: number, stepUnit: string) {
        this.baseTraj.addDateForm(map, firstDate, step, stepUnit);
    }

    public translaetDateForm(map: mapboxgl.Map) {
        this.baseTraj.translateDateForm(map);
    }

    public deleteDateForm() {
        this.baseTraj.deleteDateForm();
    }
}