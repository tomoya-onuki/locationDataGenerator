import { Traj } from "./Traj";
import dayjs, { Dayjs, ManipulateType } from 'dayjs';

export class BaseTraj extends Traj {
    private _dateList: number[] = [];
    private _$dateFormList: HTMLElement[] = [];
    private _visDateForm: boolean = false;


    public setDate(idx: number, date: number) {
        this._dateList[idx] = date;
    }

    public get dateList() {
        return this._dateList;
    }

    public get $dateFormList() {
        return this._$dateFormList;
    }

    public set visDateForm(flag: boolean) {
        this._visDateForm = flag;
    }

    public addDateForm(map: mapboxgl.Map, firstDate: string, step: number, stepUnit: string) {
        let date: Dayjs = dayjs(firstDate);
        this.pointList.forEach((point, j) => {
            let pixel = map.project([point.lng, point.lat]);

            // let id = `traj-date-form-${this.id}-${j}`
            const $dateForm: HTMLElement = <HTMLElement>document.createElement('div');
            // $dateForm.setAttribute('id', id);
            $dateForm.className = 'traj-date-form';
            $dateForm.style.top = pixel.y + 'px';
            $dateForm.style.left = pixel.x + 'px';
            $dateForm.style.display = this._visDateForm ? 'block' : 'none';

            const $dateFormDate: HTMLInputElement = document.createElement('input');
            $dateFormDate.setAttribute('type', 'date');
            $dateFormDate.value = date.format('YYYY-MM-DD');
            const $dateFormTime: HTMLInputElement = document.createElement('input');
            $dateFormTime.setAttribute('type', 'time');
            $dateFormTime.setAttribute('step', '1');
            $dateFormTime.value = date.format('HH:mm:ss');
            const setDate = () => {
                let date = dayjs(`${$dateFormDate.value} ${$dateFormTime.value}`).valueOf();
                this.setDate(j, date);
            };
            $dateFormDate.addEventListener('input', () => setDate());
            $dateFormDate.addEventListener('input', () => setDate());

            $dateForm.appendChild($dateFormDate);
            $dateForm.appendChild($dateFormTime);
            const $body: HTMLElement = <HTMLElement>document.querySelector('body');
            $body.appendChild($dateForm);

            this.$dateFormList.push($dateForm);
            this.dateList.push(date.valueOf());

            date = date.add(step, <ManipulateType>stepUnit);
        });
    }

    public translateDateForm(map: mapboxgl.Map) {
        this._$dateFormList.forEach(($dateForm, i) => {
            let pixel = map.project([this.pointList[i].lng, this.pointList[i].lat]);
            $dateForm.style.top = pixel.y + 'px';
            $dateForm.style.left = pixel.x + 'px';
        });
    }

    public deleteDateForm() {
        this._$dateFormList.forEach($dateForm => $dateForm.remove());
    }
}