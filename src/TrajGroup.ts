import chroma from "chroma-js";
import { Traj } from "./Traj";

export class TrajGroup {
    public baseTraj: Traj = new Traj();
    private subTrajList: Traj[] = [];
    private _id: number;
    private _color: string = '#eee';

    constructor(i: number) {
        this._id = i;
        this.baseTraj.color = this._color;
    }

    public get id() {
        return this._id;
    }

    public get color(): string {
        return　this._color;
    }

    public set color(c: string) {
        this._color = c;
        this.baseTraj.color = c;
        this.subTrajList.forEach(subTraj => subTraj.color = this.subColor());
    }

    public set isInterpolation(flag: boolean) {
        this.baseTraj.isInterpolation = flag;
        this.subTrajList.forEach(subTraj => subTraj.isInterpolation = flag);
    }

    public set interpolationReductionRate(rate: number) {
        this.baseTraj.interpolationReductionRate = rate;
        this.subTrajList.forEach(subTraj => subTraj.interpolationReductionRate = rate);
    }

    private subColor(): string {
        return chroma(this._color).brighten(2.0).name();
    }

    public generateSubTrajList(N: number, buff: number) {
        const newTrajList: Traj[] = [];
        for (let i = 0; i < N; i++) {
            const newTraj: Traj = new Traj();
            newTraj.color = this.subColor();
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
        });
    }
}