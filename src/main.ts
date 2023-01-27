import mapboxgl, { GeoJSONSource, GeoJSONSourceRaw } from 'mapbox-gl';
import chroma, { interpolate } from 'chroma-js';
import turfCircle from '@turf/circle';
import { Traj } from './Traj';
import { TrajGroup } from './TrajGroup';
// import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoib251dG9tbyIsImEiOiJjbGQycHIwazMwYXh5M29tcW95Nm5tdmVxIn0.nK-_6PZCDCVPEYiLQANo7A';

window.addEventListener('load', () => {
    new Main().init();
});

class Main {
    private map: mapboxgl.Map;
    private trajGroupList: TrajGroup[] = [];
    private pointBuff: number = 0;
    private trajN: number = 1;
    private trajID: number = 0;

    constructor() {
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v10',
            center: [140, 42],
            zoom: 4
        });
    }

    private initTrajList() {
        this.trajGroupList.push(new TrajGroup(this.trajID));
        this.trajID++;
    }

    public init(): void {
        this.initTrajList();


        this.map.on('load', () => {
            this.initEventLister();

            this.map.addSource('bufferArea', {
                'type': 'geojson',
                'data': {
                    "type": "FeatureCollection",
                    "features": []
                }
            });
            this.map.addLayer({
                'id': 'bufferArea',
                'type': "fill",
                'source': 'bufferArea',
                'paint': {
                    "fill-color": "#ddd",
                    "fill-opacity": 0.3
                }
            });

            this.map.addSource('subLines', {
                'type': 'geojson',
                'data': {
                    "type": "FeatureCollection",
                    "features": []
                }
            });
            this.map.addLayer({
                'id': 'subLines',
                'type': 'line',
                'source': 'subLines',
                'paint': {
                    'line-width': 2,
                    'line-color': ['get', 'color'],
                    'line-opacity': 0.3
                }
            });

            this.map.addSource('baseLines', {
                'type': 'geojson',
                'data': {
                    "type": "FeatureCollection",
                    "features": []
                }
            });
            this.map.addLayer({
                'id': 'baseLines',
                'type': 'line',
                'source': 'baseLines',
                'paint': {
                    'line-width': 3,
                    'line-color': ['get', 'color'],
                    'line-opacity': 0.8
                }
            });
        });
    }

    private initEventLister(): void {
        document.querySelectorAll<HTMLInputElement>('input[type="range"]')
            .forEach(($elem) => {
                $elem.addEventListener('input', function () {
                    const val: string = String(this.value);
                    const $prev: HTMLElement = <HTMLElement>this.previousElementSibling;
                    const $label: HTMLLabelElement = <HTMLLabelElement>$prev.querySelector('span');
                    $label.textContent = val;
                });
            });

        const $pointBuff: HTMLInputElement = <HTMLInputElement>document.querySelector('#point-buff');
        $pointBuff.addEventListener('input', () => {
            this.pointBuff = Number($pointBuff.value);
            this.drawLines();
        });

        const $trajN: HTMLInputElement = <HTMLInputElement>document.querySelector('#trajectory-num');
        $trajN.addEventListener('input', () => {
            this.trajN = Number($trajN.value);
        });

        // ベースラインに合わせてランダムで複数の軌跡を生成
        const $geneBtn: HTMLButtonElement = <HTMLButtonElement>document.querySelector('#generate');
        $geneBtn.addEventListener('click', () => {
            this.trajGroupList.forEach((trajGroup) => {
                trajGroup.generateSubTrajList(this.trajN, this.pointBuff)
            });
            this.interpolate();
            this.drawLines();
        });

        // 軌跡の登録モーダルの表示
        const $map = <HTMLElement>document.querySelector('#map');
        $map.addEventListener('click', (e) => {
            const $modal: HTMLElement = <HTMLElement>document.querySelector('#traj-modal');
            $modal.style.display = 'block';
            $modal.style.top = e.clientY + 'px'
            $modal.style.left = e.clientX + 'px'
        });

        this.map.on('click', (e) => {
            if (this.trajGroupList.length > 0) {
                let last: number = this.trajGroupList.length - 1;
                this.trajGroupList[last].baseTraj.add({
                    lng: Number(e.lngLat.wrap().lng),
                    lat: Number(e.lngLat.wrap().lat)
                });
                this.colored();
                this.interpolate();
                this.drawLines();
            }
        });

        const $register = <HTMLButtonElement>document.querySelector('#traj-register');
        $register.addEventListener('click', () => {
            this.registerBaseTraj();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.registerBaseTraj();
            }
        });

        const $autoColorScheme: HTMLInputElement = <HTMLInputElement>document.querySelector('#auto-color');
        $autoColorScheme.addEventListener('input', () => {
            this.colored();
            this.drawLines();
        });

        const $interpolation: HTMLInputElement = <HTMLInputElement>document.querySelector('#interpolation');
        $interpolation.addEventListener('input', () => {
            this.interpolate();
            this.drawLines();
        });
        const $reductionRate: HTMLInputElement = <HTMLInputElement>document.querySelector('#rediction-rate');
        $reductionRate.addEventListener('input', () => {
            this.interpolate();
            this.drawLines();
        });
    }

    private drawLines(): void {
        const baseGeojson: any = {
            'type': 'FeatureCollection',
            'features': this.trajGroupList.map(trajGroup => {
                return trajGroup.baseTraj.feature();
            })
        };

        const subGeojson: any = {
            'type': 'FeatureCollection',
            'features': this.trajGroupList.map(trajGroup => {
                return trajGroup.subTrajListFeatures();
            }).flat()
        };

        // Buffer範囲を描画
        const bufAreaGeojson: any = {
            'type': 'FeatureCollection',
            'features': this.trajGroupList.map(trajGroup => {
                return trajGroup.baseTraj.pointList.map(point => {
                    let radius: number = this.pointBuff;
                    let center: number[] = [point.lng, point.lat];
                    return turfCircle(center, radius, { steps: 64, units: 'degrees' });
                });
            }).flat()
        };
        let baseLineSource: GeoJSONSource = <GeoJSONSource>this.map.getSource('baseLines');
        let subLineSource: GeoJSONSource = <GeoJSONSource>this.map.getSource('subLines');
        let buffAreaSource: GeoJSONSource = <GeoJSONSource>this.map.getSource('bufferArea');

        baseLineSource.setData(baseGeojson);
        subLineSource.setData(subGeojson);
        buffAreaSource.setData(bufAreaGeojson);
    }

    private interpolate() {
        const $interpolation: HTMLInputElement = <HTMLInputElement>document.querySelector('#interpolation');
        const $reductionRate: HTMLInputElement = <HTMLInputElement>document.querySelector('#rediction-rate');
        const flag: boolean = Boolean($interpolation.checked);
        const rate: number = Number($reductionRate.value) / 100;
        this.trajGroupList.forEach(trajGroup => {
            trajGroup.isInterpolation = flag;
            trajGroup.interpolationReductionRate = rate;
        });
    }

    private colored() {
        const $autoColorScheme: HTMLInputElement = <HTMLInputElement>document.querySelector('#auto-color');
        const flag: boolean = Boolean($autoColorScheme.checked);
        this.trajGroupList.forEach((groupTraj, i) => {
            const h: number = i / this.trajGroupList.length * 360;
            const color: string = flag ? chroma.hsv(h, 0.8, 1.0).name() : '#eeeeee';
            groupTraj.color = color;
            let $input: HTMLInputElement = <HTMLInputElement>document.querySelector(`#traj-${groupTraj.id}`);
            if ($input != null) {
                $input.value = color;
            }

        });
    }

    private registerBaseTraj() {
        const $modal: HTMLElement = <HTMLElement>document.querySelector('#traj-modal');
        $modal.style.display = 'none';

        // UIに追加
        const last: number = this.trajGroupList.length - 1;
        const id: number = this.trajGroupList[last].id;
        const $trajItem: HTMLElement = document.createElement('div');
        $trajItem.className = 'traj-item';

        const $trajItemColor: HTMLInputElement = document.createElement('input');
        $trajItemColor.setAttribute('type', 'color');
        $trajItemColor.setAttribute('id', `traj-${id}`);
        $trajItemColor.value = this.trajGroupList[last].color;
        $trajItemColor.addEventListener('input', () => {
            this.trajGroupList[last].baseTraj.color = chroma($trajItemColor.value).css();
            this.drawLines();
        });

        const $trajItemLabel: HTMLLabelElement = document.createElement('label');
        $trajItemLabel.setAttribute('for', `traj-${id}`);
        $trajItemLabel.textContent = '#' + (`000${id}`.slice(-3));
        const $trajItemDelBtn: HTMLButtonElement = document.createElement('button');
        $trajItemDelBtn.textContent = 'del';
        $trajItemDelBtn.addEventListener('click', () => {
            this.trajGroupList = this.trajGroupList.filter(trajgroup => trajgroup.id !== id);
            $trajItem.remove();
            this.drawLines();
        });

        const $trajItemRstBtn: HTMLButtonElement = document.createElement('button');
        $trajItemRstBtn.textContent = 'rst';
        $trajItemRstBtn.addEventListener('click', () => {
            this.trajGroupList[last].clearSubTrajList();
            this.drawLines();
        });

        $trajItem.appendChild($trajItemColor);
        $trajItem.appendChild($trajItemLabel);
        $trajItem.appendChild($trajItemRstBtn);
        $trajItem.appendChild($trajItemDelBtn);
        const $trajList: HTMLElement = <HTMLElement>document.querySelector('#traj-list');
        $trajList.appendChild($trajItem);

        this.drawLines();

        // 次に追加する軌跡
        this.initTrajList();
    }
}