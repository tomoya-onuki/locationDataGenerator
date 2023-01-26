import chroma from 'chroma-js';

export class Traj {
    private _pointList: { lng: number, lat: number }[] = [];
    private _color: string = '#222';

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


    public feature(): object {
        return {
            'type': 'Feature',
            'properties': {
                'color': chroma(this._color).alpha(0.9).css()
            },
            'geometry': {
                'type': 'LineString',
                'coordinates': this._pointList.map((point) => {
                    return [point.lng, point.lat];
                })
            }
        };
    }

    public dump() {
        console.log(this._pointList);
    }
}