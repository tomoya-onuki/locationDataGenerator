import mapboxgl, { GeoJSONSource, GeoJSONSourceRaw } from 'mapbox-gl';
import chroma from 'chroma-js';
import turfCircle from '@turf/circle'
import turfBuffer from '@turf/buffer'
import { point } from '@turf/helpers'
import { Traj } from './Traj';
// import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoib251dG9tbyIsImEiOiJjbGQycHIwazMwYXh5M29tcW95Nm5tdmVxIn0.nK-_6PZCDCVPEYiLQANo7A';

window.addEventListener('load', () => {
    new Main().init();
});

class Main {
    private map: mapboxgl.Map;
    private baseTrajList: { [key: number]: Traj } = {};
    private subTrajList: { [key: number]: Traj[] } = {};
    private pointBuff: number = 0;
    private trajN: number = 1;

    constructor() {
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [139.7670516, 35.6811673],
            zoom: 4
        });
    }

    public init(): void {
        let len = Object.keys(this.baseTrajList).length;
        this.baseTrajList[len] = new Traj();

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
                    "fill-color": "#444",
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
                    'line-opacity': 0.6
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
            Object.keys(this.baseTrajList).forEach((key) => {
                const idx = Number(key);
                const traj = this.baseTrajList[idx];
                const newTrajList: Traj[] = [];
                for (let i = 0; i < this.trajN; i++) {
                    const newTraj: Traj = new Traj();
                    newTraj.color = chroma(traj.color).brighten(2).name();
                    newTraj.pointList = traj.pointList.map(point => {
                        return {
                            lng: point.lng + (Math.random() - 0.5) * this.pointBuff,
                            lat: point.lat + (Math.random() - 0.5) * this.pointBuff
                        };
                    });
                    newTrajList.push(newTraj);
                }

                this.subTrajList[idx] = newTrajList;
            });

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
            if (Object.keys(this.baseTrajList).length > 0) {
                // 末尾の軌跡に座標を追加していく
                let last: number = Object.keys(this.baseTrajList).length - 1;
                this.baseTrajList[last].color = '#222';
                this.baseTrajList[last].add({
                    lng: Number(e.lngLat.wrap().lng),
                    lat: Number(e.lngLat.wrap().lat)
                });
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
    }

    private drawLines(): void {
        const baseGeojson: any = {
            'type': 'FeatureCollection',
            'features': Object.keys(this.baseTrajList).map(key => {
                return this.baseTrajList[Number(key)].feature();
            })
        };

        const subGeojson: any = {
            'type': 'FeatureCollection',
            'features': Object.keys(this.subTrajList).map(key => {
                return this.subTrajList[Number(key)].map(traj => traj.feature());
            }).flat()
        };

        // Buffer範囲を描画
        const bufAreaGeojson: any = {
            'type': 'FeatureCollection',
            'features': Object.keys(this.baseTrajList).map(key => {
                return this.baseTrajList[Number(key)].pointList.map(point => {
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
        // console.log(mapSource);
        // console.log(geojson);
        console.log(this.baseTrajList);
        console.log(this.subTrajList);
    }

    private registerBaseTraj() {
        const $modal: HTMLElement = <HTMLElement>document.querySelector('#traj-modal');
        $modal.style.display = 'none';

        // UIに追加
        const idx: number = Object.keys(this.baseTrajList).length - 1;
        const id: string = `traj-${idx}`;
        const $trajItem: HTMLElement = document.createElement('div');
        $trajItem.className = 'traj-item';
        const $trajItemColor: HTMLInputElement = document.createElement('input');
        $trajItemColor.setAttribute('type', 'color');
        $trajItemColor.setAttribute('id', id);
        $trajItemColor.addEventListener('input', () => {
            this.baseTrajList[idx].color = chroma($trajItemColor.value).name();
            this.subTrajList[idx].forEach(traj => {
                traj.color = chroma($trajItemColor.value).brighten(2).name();
            });
            this.drawLines();
        });
        const $trajItemLabel: HTMLLabelElement = document.createElement('label');
        $trajItemLabel.setAttribute('for', id);
        $trajItemLabel.textContent = '#' + (`000${idx}`.slice(-3));
        const $trajItemDelBtn: HTMLButtonElement = document.createElement('button');
        $trajItemDelBtn.textContent = 'del';
        $trajItemDelBtn.addEventListener('click', () => {
            delete this.baseTrajList[idx];
            delete this.subTrajList[idx];
            $trajItem.remove();
            let len = Object.keys(this.baseTrajList).length;
            this.baseTrajList[len] = new Traj();
            this.drawLines();
        });
        const $trajItemRstBtn: HTMLButtonElement = document.createElement('button');
        $trajItemRstBtn.textContent = 'rst';
        $trajItemRstBtn.addEventListener('click', () => {
            delete this.subTrajList[idx];
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
        let len = Object.keys(this.baseTrajList).length;
        this.baseTrajList[len] = new Traj();
    }
}