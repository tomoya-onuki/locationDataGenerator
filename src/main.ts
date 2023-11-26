import mapboxgl from 'mapbox-gl';
import chroma from 'chroma-js';
import dayjs from 'dayjs';
import JSZip from 'jszip';
import { Chart } from './Chart';
mapboxgl.accessToken = String(process.env.MAPBOX_GL_ACCESS_TOKEN);
console.log(process.env.MAPBOX_GL_ACCESS_TOKEN)

window.addEventListener('load', () => {
    new Main().init();
});

class Main {
    private map: mapboxgl.Map;
    private chart: Chart;

    constructor() {
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v10',
            center: [140, 42],
            zoom: 4
        });
        this.chart = new Chart(this.map);
    }

    public init(): void {
        this.map.on('load', () => {
            this.initEventLister();
            this.chart.init();
        });
    }

    private initEventLister(): void {
        // スライダのラベルの更新
        document.querySelectorAll<HTMLInputElement>('input[type="range"]')
            .forEach(($elem) => {
                $elem.addEventListener('input', function () {
                    const val: string = String(this.value);
                    const $prev: HTMLElement = <HTMLElement>this.previousElementSibling;
                    const $label: HTMLLabelElement = <HTMLLabelElement>$prev.querySelector('span');
                    $label.textContent = val;
                });
            });
        // 自動生成する軌跡のばらつき
        const $pointBuff: HTMLInputElement = <HTMLInputElement>document.querySelector('#point-buff');
        $pointBuff.addEventListener('input', () => {
            this.chart.pointBuff = Number($pointBuff.value);
            this.chart.draw();
        });
        // 自動生成する軌跡の本数
        const $trajN: HTMLInputElement = <HTMLInputElement>document.querySelector('#trajectory-num');
        $trajN.addEventListener('input', () => {
            this.chart.trajN = Number($trajN.value);
        });

        // ベースラインに合わせてランダムで複数の軌跡を生成
        const $geneBtn: HTMLButtonElement = <HTMLButtonElement>document.querySelector('#generate');
        $geneBtn.addEventListener('click', () => {
            this.chart.generateSubTrajList();
            this.chart.interpolate();
            this.chart.draw();
        });

        // 軌跡の登録モーダルの表示
        const $map = <HTMLElement>document.querySelector('#map');
        $map.addEventListener('click', (e) => {
            const $modal: HTMLElement = <HTMLElement>document.querySelector('#traj-modal');
            $modal.style.display = 'block';
            $modal.style.top = e.clientY + 'px'
            $modal.style.left = e.clientX + 'px'
        });
        // 軌跡の点を追加する
        this.map.on('click', (e) => {
            let lng: number = Number(e.lngLat.wrap().lng);
            let lat: number = Number(e.lngLat.wrap().lat);
            if (this.chart.addPoint(lng, lat)) {
                this.chart.colored();
                this.chart.interpolate();
                this.chart.draw();
            }
        });
        // 書いた軌跡の登録
        const $register = <HTMLButtonElement>document.querySelector('#traj-register');
        $register.addEventListener('click', () => {
            this.registerTrajController();
        });
        $map.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.registerTrajController();
            }
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const $modal: HTMLElement = <HTMLElement>document.querySelector('#traj-modal');
                $modal.style.display = 'none';
                let id = this.chart.addingTrajGroup.id;
                this.chart.deleteTrajGroup(id);
                this.chart.updateTraj();
                this.chart.draw();

                document.querySelectorAll('input').forEach($input => {
                    $input.blur();
                });
            }
        });
        window.addEventListener('beforeunload', (event) => {
            event.preventDefault();
            event.returnValue = '';
          });

        // 軌跡の自動配色のON/OFF
        const $autoColorScheme: HTMLInputElement = <HTMLInputElement>document.querySelector('#auto-color');
        $autoColorScheme.addEventListener('input', () => {
            this.chart.colored();
            this.chart.draw();
        });
        // 時刻のエンコードのON/OFF
        const $timeGradient: HTMLInputElement = <HTMLInputElement>document.querySelector('#time-gradient');
        $timeGradient.addEventListener('input', () => {
            const flag: boolean = Boolean($timeGradient.checked);
            this.chart.setIsTimeEncode(flag);
            this.chart.draw();
        });
        // スムージングのON/OFF
        const $interpolation: HTMLInputElement = <HTMLInputElement>document.querySelector('#interpolation');
        $interpolation.addEventListener('input', () => {
            this.chart.isInterpolation = $interpolation.checked;
            this.chart.interpolate();
            this.chart.draw();
        });
        // スムージングの点の削減率
        const $reductionRate: HTMLInputElement = <HTMLInputElement>document.querySelector('#rediction-rate');
        $reductionRate.addEventListener('input', () => {
            this.chart.interpolationReductionRate = Number($reductionRate.value) / 100;
            this.chart.interpolate();
            this.chart.draw();
        });

        // 時刻フォームのON/OFF
        const $dateFormOn: HTMLInputElement = <HTMLInputElement>document.querySelector('#date-form-on');
        $dateFormOn.addEventListener('input', () => {
            this.chart.visDateForm = $dateFormOn.checked;
        });

        // 時刻フォームのスケーリング
        this.map.on('move', () => {
            this.chart.translateDateForm();
        });
        const $firstDate: HTMLInputElement = <HTMLInputElement>document.querySelector('#first-date');
        $firstDate.value = dayjs().format('YYYY-MM-DD');

        // ファイル保存
        const $fileFormat: HTMLSelectElement = <HTMLSelectElement>document.querySelector('#file-format');
        const $fileIntegrate: HTMLInputElement = <HTMLInputElement>document.querySelector('#file-integrate');
        const $saveBtn: HTMLButtonElement = <HTMLButtonElement>document.querySelector('#save-file');
        $saveBtn.addEventListener('click', () => {
            let type: string = $fileFormat.options[$fileFormat.options.selectedIndex].value;
            let ext = '.' + type;
            if (type === 'umidori') ext = '.csv';
            if (type === 'axyvis') ext = '.txt';

            let jszip: JSZip = new JSZip();

            this.chart.save(type, $fileIntegrate.checked).forEach((str, i) => {
                let fname = $fileIntegrate.checked ? `traj${ext}` : `traj${i}${ext}`;
                if (type === 'umidori') fname = 'umidori_auto_' + fname;
                if (type === 'axyvis') fname = 'axy_auto_' + fname;

                jszip.file(fname, str);
            });
            jszip.generateAsync({ type: 'blob' }).then((blob) => { // Blob の取得
                let link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'trajectories.zip';
                link.click();
            });
        });


        const $helpPane: HTMLElement = <HTMLElement>document.querySelector('#help-pane');
        const $openHelpPane: HTMLElement = <HTMLElement>document.querySelector('#open-help-pane');
        $openHelpPane.addEventListener('click', () => $helpPane.style.display = 'block');
        const $closeHelpPane: HTMLElement = <HTMLElement>document.querySelector('#close-help-pane');
        $closeHelpPane.addEventListener('click', () => $helpPane.style.display = 'none');
    }


    private registerTrajController() {
        const $modal: HTMLElement = <HTMLElement>document.querySelector('#traj-modal');
        $modal.style.display = 'none';

        // UIに追加
        const id: number = this.chart.addingTrajGroup.id;
        const $trajItem: HTMLElement = document.createElement('div');
        $trajItem.className = 'traj-item';

        const $trajItemColor: HTMLInputElement = document.createElement('input');
        $trajItemColor.setAttribute('type', 'color');
        $trajItemColor.setAttribute('id', `traj-${id}`);
        $trajItemColor.value = this.chart.addingTrajGroup.color;
        $trajItemColor.addEventListener('input', () => {
            if (this.chart.hasID(id)) {
                this.chart.getTrajGroup(id).color = chroma($trajItemColor.value).css();
                this.chart.draw();
            }
        });

        const $trajItemLabel: HTMLLabelElement = document.createElement('label');
        $trajItemLabel.setAttribute('for', `traj-${id}`);
        $trajItemLabel.textContent = 'trj' + (`000${id}`.slice(-3));
        const $trajItemDelBtn: HTMLButtonElement = document.createElement('button');
        $trajItemDelBtn.textContent = 'delete';
        $trajItemDelBtn.addEventListener('click', () => {
            this.chart.deleteTrajGroup(id);
            $trajItem.remove();
            this.chart.draw();
        });

        const $trajItemRstBtn: HTMLButtonElement = document.createElement('button');
        $trajItemRstBtn.textContent = 'clear';
        $trajItemRstBtn.addEventListener('click', () => {
            if (this.chart.hasID(id)) {
                this.chart.getTrajGroup(id).clearSubTrajList();
                this.chart.draw();
            }
        });

        const $trajItemVis: HTMLInputElement = document.createElement('input');
        $trajItemVis.setAttribute('type', 'checkbox');
        $trajItemVis.setAttribute('id', `traj-vis-${id}`);
        $trajItemVis.checked = true;
        const $trajItemVisLabel: HTMLLabelElement = document.createElement('label');
        $trajItemVisLabel.setAttribute('for', `traj-vis-${id}`);
        $trajItemVisLabel.classList.add('material-symbols-outlined')
        $trajItemVisLabel.classList.add('traj-vis-label')
        $trajItemVisLabel.textContent = 'visibility';
        $trajItemVis.addEventListener('input', () => {
            $trajItemVisLabel.textContent = $trajItemVis.checked ? 'visibility' : 'visibility_off';
            if (this.chart.hasID(id)) {
                this.chart.getTrajGroup(id).vis = $trajItemVis.checked;
                this.chart.draw();
            }
        });

        $trajItem.appendChild($trajItemColor);
        $trajItem.appendChild($trajItemLabel);
        $trajItem.appendChild($trajItemVis);
        $trajItem.appendChild($trajItemVisLabel);
        $trajItem.appendChild($trajItemRstBtn);
        $trajItem.appendChild($trajItemDelBtn);
        const $trajList: HTMLElement = <HTMLElement>document.querySelector('#traj-list');
        $trajList.appendChild($trajItem);

        // 時刻指定フォームの追加
        const $dateStep: HTMLInputElement = <HTMLInputElement>document.querySelector('#date-step');
        const $dateStepUnitSelector: HTMLSelectElement = <HTMLSelectElement>document.querySelector('#date-step-unit');
        const $dateStepUnit = $dateStepUnitSelector.options[$dateStepUnitSelector.selectedIndex];
        const $firstDate: HTMLInputElement = <HTMLInputElement>document.querySelector('#first-date');
        const $firstTime: HTMLInputElement = <HTMLInputElement>document.querySelector('#first-time');
        this.chart.addDateForm(`${$firstDate.value} ${$firstTime.value}`, Number($dateStep.value), $dateStepUnit.value);

        this.chart.draw();

        // 次に追加する軌跡
        this.chart.updateTraj();
    }
}

// class SpeedController {
//     private $cvs: HTMLCanvasElement;
//     private ctx: CanvasRenderingContext2D;
//     private width: number;
//     private height: number;
//     private padding: { top: number, right: number, bottom: number, left: number } = {
//         // top: 0, right: 0, bottom: 0, left: 0
//         top: 20 * devicePixelRatio,
//         right: 20 * devicePixelRatio,
//         bottom: 20 * devicePixelRatio,
//         left: 20 * devicePixelRatio
//     };

//     private controlPointList: ControlPoint[] = [];
//     private selectedControlPoint: ControlPoint = new ControlPoint(false);


//     constructor(_cvs: HTMLCanvasElement) {
//         this.$cvs = _cvs;
//         this.ctx = <CanvasRenderingContext2D>this.$cvs.getContext('2d');
//         this.$cvs.width *= devicePixelRatio;
//         this.$cvs.height *= devicePixelRatio;
//         this.width = this.$cvs.width - this.padding.left - this.padding.right;
//         this.height = this.$cvs.height - this.padding.top - this.padding.bottom;

//         this.controlPointList.push(new ControlPoint(true, 0, this.height / 2));
//         this.controlPointList.push(new ControlPoint(true, this.width, this.height / 2));
//         this.draw();
//     }


//     public mouseDown(mouseX: number, mouseY: number) {
//         mouseX = this.mouseXscaling(mouseX);
//         mouseY = this.mouseYscaling(mouseY);
//         let token = this.controlPointList.find(cp => cp.isOver(mouseX, mouseY));
//         if (token !== undefined) {
//             this.selectedControlPoint = token;
//         } else {
//             this.selectedControlPoint = new ControlPoint(false);
//             this.selectedControlPoint.update(mouseX, mouseY);
//             this.controlPointList.push(this.selectedControlPoint);
//         }
//         this.draw();
//     }

//     private mouseXscaling(x: number): number {
//         return x * 1.5 * devicePixelRatio - this.padding.left;
//     }
//     private mouseYscaling(y: number): number {
//         return y * 1.5 * devicePixelRatio - this.padding.top;
//     }


//     public mouseMove(mouseX: number, mouseY: number) {
//         mouseX = this.mouseXscaling(mouseX);
//         mouseY = this.mouseYscaling(mouseY);
//         if (mouseX > this.width) {
//             mouseX = this.width;
//         } else if (mouseX < 0) {
//             mouseX = 0;
//         }
//         if (mouseY > this.height) {
//             mouseY = this.height;
//         } else if (mouseY < 0) {
//             mouseY = 0;
//         }
//         this.selectedControlPoint.update(mouseX, mouseY);
//         this.draw();
//     }

//     public mouseUp() {
//         this.selectedControlPoint = new ControlPoint(false);
//     }

//     private draw() {
//         this.ctx.clearRect(0, 0, this.$cvs.width, this.$cvs.height);

//         this.ctx.save();
//         this.ctx.translate(this.padding.top, this.padding.left);

//         this.ctx.fillStyle = '#222';
//         this.ctx.strokeStyle = '#222';
//         this.controlPointList.sort((a, b) => a.x - b.x);
//         this.controlPointList.forEach((cp, i) => cp.draw(this.ctx));
//         this.ctx.beginPath();
//         this.controlPointList.forEach((cp, i) => {
//             if (i === 0) {
//                 this.ctx.moveTo(cp.x, cp.y);
//             } else {
//                 this.ctx.lineTo(cp.x, cp.y);
//             }
//         });
//         this.ctx.stroke();

//         this.ctx.restore();
//     }

//     public getSpeed(dateRatio: number) {
//         for (let i = 0; i < this.controlPointList.length - 1; i++) {
//             const c0 = this.controlPointList[i];
//             const c1 = this.controlPointList[i + 1];
//             const dateRatio0 = c0.x / this.width;
//             const dateRatio1 = c1.x / this.width;
//             const speedRatio0 = c0.y / this.height;
//             const speedRatio1 = c1.y / this.height;

//             if (dateRatio0 <= dateRatio && dateRatio < dateRatio1) {
//                 return (speedRatio1 - speedRatio0) / (dateRatio1 - dateRatio0) * (dateRatio - dateRatio1) + speedRatio1;
//             }
//         }

//         return -1;
//     }
// }

// class ControlPoint {
//     private _x: number = 0;
//     private _y: number = 0;
//     private r: number = 4 * devicePixelRatio;
//     private _isOver: boolean = false;
//     private _isFixed: boolean = false;

//     constructor(isF: boolean);
//     constructor(isF: boolean, x: number, y: number);
//     constructor(isF?: boolean, x?: number, y?: number) {
//         if (x !== null) this._x = Number(x);
//         if (y !== null) this._y = Number(y);
//         if (isF != null) this._isFixed = Boolean(isF);
//     }

//     public isOver(mouseX: number, mouseY: number): boolean {
//         if (this._x - this.r * 2 <= mouseX && mouseX <= this._x + this.r * 2
//             && this._y - this.r * 2 <= mouseY && mouseY <= this._y + this.r * 2) {
//             this._isOver = true;
//             console.log(this._isOver)
//             return true;
//         }
//         this._isOver = false;
//         console.log(this._isOver)
//         return false;
//     }

//     public draw(ctx: CanvasRenderingContext2D) {
//         ctx.fillStyle = this._isOver ? '#444' : '#222';
//         ctx.beginPath();
//         ctx.ellipse(this._x, this._y, this.r * 2, this.r * 2, 2 * Math.PI, 0, 2 * Math.PI);
//         ctx.fill();
//         ctx.closePath();
//     }

//     public get x() {
//         return this._x;
//     }
//     public get y() {
//         return this._y;
//     }

//     public update(mouseX: number, mouseY: number) {
//         if (!this._isFixed) this._x = mouseX;
//         this._y = mouseY;
//     }
// }