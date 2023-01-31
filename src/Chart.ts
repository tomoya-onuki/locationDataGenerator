import mapboxgl, { GeoJSONSource } from 'mapbox-gl';
import chroma from 'chroma-js';
import turfDistance from '@turf/distance';
import { point } from '@turf/turf';
import { TrajGroup } from './TrajGroup';
import dayjs from 'dayjs';
import xmlFormat from 'xml-formatter';

export class Chart {
    private map: mapboxgl.Map;
    private _trajGroupList: TrajGroup[] = [];
    private _pointBuff: number = 0;
    private _trajN: number = 1;
    private trajID: number = 0;
    private _isInterpolation: boolean = false;
    private _interpolationReductionRate: number = 0.0;
    private _visDateForm: boolean = false;


    constructor(_map: mapboxgl.Map) {
        this.map = _map;
    }

    public init() {
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
                "fill-color": "#222",
                "fill-opacity": 0.2
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
            'lineMetrics': true,
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
                'line-opacity': 0.9,
            },
            'layout': {
                'line-cap': 'round',
                'line-join': 'round',
            }
        });

        this.updateTraj();
    }

    public updateTraj() {
        this._trajGroupList.push(new TrajGroup(this.trajID));
        this.trajID++;
    }

    public set trajN(n: number) {
        this._trajN = n;
    }

    public set pointBuff(buff: number) {
        this._pointBuff = buff;
    }


    public set isInterpolation(flag: boolean) {
        this._isInterpolation = flag;
    }

    public set interpolationReductionRate(rate: number) {
        this._interpolationReductionRate = rate;
    }

    public setIsTimeEncode(flag: boolean) {
        this._trajGroupList.forEach(trajGroup => trajGroup.isTimeEncode = flag);
    }

    public draw() {
        const baseGeojson: any = {
            'type': 'FeatureCollection',
            'features': this._trajGroupList.map(trajGroup => {
                return trajGroup.baseTraj.feature();
            }).flat()
        };

        const subGeojson: any = {
            'type': 'FeatureCollection',
            'features': this._trajGroupList.map(trajGroup => {
                return trajGroup.subTrajListFeatures();
            }).flat()
        };

        // Buffer範囲を描画
        const bufAreaGeojson: any = {
            'type': 'FeatureCollection',
            'features': this._trajGroupList.map(trajGroup => {
                return trajGroup.baseTraj.circles(this._pointBuff);
            }).flat()
        };

        let baseLineSource: GeoJSONSource = <GeoJSONSource>this.map.getSource('baseLines');
        let subLineSource: GeoJSONSource = <GeoJSONSource>this.map.getSource('subLines');
        let buffAreaSource: GeoJSONSource = <GeoJSONSource>this.map.getSource('bufferArea');

        baseLineSource.setData(baseGeojson);
        subLineSource.setData(subGeojson);
        buffAreaSource.setData(bufAreaGeojson);
    }

    public interpolate() {
        this._trajGroupList.forEach(trajGroup => {
            trajGroup.isInterpolation = this._isInterpolation;
            trajGroup.interpolationReductionRate = this._interpolationReductionRate;
        });
    }

    public colored() {
        const $autoColorScheme: HTMLInputElement = <HTMLInputElement>document.querySelector('#auto-color');
        const flag: boolean = Boolean($autoColorScheme.checked);
        this._trajGroupList.forEach((groupTraj, i) => {
            const h: number = i / this._trajGroupList.length * 360;
            const color: string = flag ? chroma.hsv(h, 0.8, 1.0).name() : '#222222';
            groupTraj.color = color;
            let $input: HTMLInputElement = <HTMLInputElement>document.querySelector(`#traj-${groupTraj.id}`);
            if ($input != null) {
                $input.value = color;
            }

        });
    }

    public addPoint(lng: number, lat: number): boolean {
        if (this._trajGroupList.length > 0) {
            this.addingTrajGroup.baseTraj.add({ lng: lng, lat: lat });
            return true;
        }
        return false;
    }

    public generateSubTrajList() {
        this._trajGroupList.forEach((trajGroup) => {
            trajGroup.generateSubTrajList(this._trajN, this._pointBuff)
        });
    }

    public get addingTrajGroup(): TrajGroup {
        return this._trajGroupList[this._trajGroupList.length - 1];
    }

    public hasID(id: number): boolean {
        let token = this._trajGroupList.find(trajgroup => trajgroup.id === id);
        if (token !== undefined) {
            return true;
        } else {
            return false;
        }
    }

    public getTrajGroup(id: number): TrajGroup {
        let token = this._trajGroupList.find(trajgroup => trajgroup.id === id);
        if (token !== undefined) {
            return token;
        } else {
            return new TrajGroup(-1);
        }
    }

    public deleteTrajGroup(id: number) {
        let deletedTrajGroup = this._trajGroupList.find(trajgroup => trajgroup.id === id);
        if (deletedTrajGroup != undefined) {
            deletedTrajGroup.deleteDateForm();
        }
        this._trajGroupList = this._trajGroupList.filter(trajgroup => trajgroup.id !== id);
    }


    public set visDateForm(flag: boolean) {
        this._visDateForm = flag;
        this._trajGroupList.forEach(trajGroup => {
            trajGroup.visDateForm = flag;
        });
    }

    public addDateForm(firstDate: string, step: number, stepUnit: string) {
        this.addingTrajGroup.visDateForm = this._visDateForm;
        this.addingTrajGroup.addDateForm(this.map, firstDate, step, stepUnit);
    }

    public translateDateForm() {
        this._trajGroupList.forEach(trajGroup => trajGroup.translaetDateForm(this.map));
    }

    public save(type: string, integrate: boolean): string[] {
        function hex2kmlcolor(hex: string): string {
            hex = hex.replace('#', '');
            if (hex.length === 6) {
                hex = '00' + hex;
            }
            return hex.split("").reverse().join("");
        }
        function hex2gpxcolor(hex: string): number[] {
            let rgb = chroma(hex).rgb().map(v => v / 255);
            let alpha = chroma(hex).rgba()[3];
            return [...rgb, alpha];
        }

        switch (type) {
            case 'csv':
                if (!integrate) {
                    return this.timeSeriesData().map(jsonList => {
                        let csvStr: string = 'date,lon,lat\n';
                        jsonList.forEach(json => {
                            csvStr += `${json.date},${json.lng},${json.lat}\n`;
                        });
                        return csvStr;
                    });
                } else {
                    let csvStr: string = '';
                    this.timeSeriesData().forEach(jsonList => {
                        csvStr += 'date,lng,lat\n';
                        jsonList.forEach(json => {
                            csvStr += `${json.date},${json.lng},${json.lat}\n`;
                        });
                        csvStr += '\n';
                    });
                    return [csvStr];
                }
            case 'tsv':
                if (!integrate) {
                    return this.timeSeriesData().map(jsonList => {
                        let csvStr: string = 'date\tlng\tlat\n';
                        jsonList.forEach(json => {
                            csvStr += `${json.date}\t${json.lng}\t${json.lat}\n`;
                        });
                        return csvStr;
                    });
                } else {
                    let csvStr: string = '';
                    this.timeSeriesData().forEach(jsonList => {
                        csvStr += 'date\tlng\tlat\n';
                        jsonList.forEach(json => {
                            csvStr += `${json.date}\t${json.lng}\t${json.lat}\n`;
                        });
                        csvStr += '\n';
                    });
                    return [csvStr];
                }
            case 'umidori':
                if (!integrate) {
                    return this.timeSeriesData().map((jsonList, i) => {
                        let csvStr: string = 'binID, date, med_lon, med_lat, sd_lon, sd_lat, SEM_lon, SEM_lat, samplesize, year, distperday, month, day, confidence, distcolony, bird\n';
                        jsonList.forEach((json, j) => {
                            let y = dayjs(json.date).format('YYYY');
                            let m = dayjs(json.date).format('MM');
                            let d = dayjs(json.date).format('DD');
                            let date = dayjs(json.date).format('DD-MMM-YYYY HH:mm:ss');
                            csvStr += `${j},${date},${json.lng},${json.lat},,,,,0,${y},,${m},${d},,,traj${i}\n`;
                        });
                        return csvStr;
                    });
                } else {
                    let csvStr: string = '';
                    this.timeSeriesData().forEach((jsonList, i) => {
                        csvStr += 'binID, date, med_lon, med_lat, sd_lon, sd_lat, SEM_lon, SEM_lat, samplesize, year, distperday, month, day, confidence, distcolony, bird\n';
                        jsonList.forEach((json, j) => {
                            let y = dayjs(json.date).format('YYYY');
                            let m = dayjs(json.date).format('MM');
                            let d = dayjs(json.date).format('DD');
                            csvStr += `${j},${json.date},${json.lng},${json.lat},${json.lng},${json.lat},${json.lng},${json.lat},0,${y},,${m},${d},,,traj${i}\n`;
                        });
                        csvStr += '\n';
                    });
                    return [csvStr];
                }
            case 'axyvis':
                if (!integrate) {
                    return this.timeSeriesData().map((jsonList) => {
                        let csvStr: string = '';
                        for (let i = 0; i < jsonList.length - 1; i++) {
                            const json0 = jsonList[i];
                            const json1 = jsonList[i + 1];
                            let date = dayjs(json0.date).format('DD-MMM-YYYY,HH:mm:ss');
                            
                            let speed: number = turfDistance(point([json0.lng, json0.lat]), point([json1.lng, json1.lat])) / Number(dayjs(json0.date).diff(dayjs(json1.date), 'hour'));
                            csvStr += `${date}\t${json0.lng}\t${json0.lat}\t${speed}\n`;
                        }
                        return csvStr;
                    });
                } else {
                    let csvStr: string = '';
                    this.timeSeriesData().forEach((jsonList) => {
                        for (let i = 0; i < jsonList.length - 1; i++) {
                            const json0 = jsonList[i];
                            const json1 = jsonList[i + 1];
                            let date = dayjs(json0.date).format('DD-MMM-YYYY,HH:mm:ss');
                            
                            let speed: number = turfDistance(point([json0.lng, json0.lat]), point([json1.lng, json1.lat])) / Number(dayjs(json0.date).diff(dayjs(json1.date), 'hour'));
                            csvStr += `${date}\t${json0.lng}\t${json0.lat}\t${speed}\n`;
                        }
                        csvStr += '\n';
                    });
                    return [csvStr];
                }
            case 'kml':
                if (!integrate) {
                    return this.timeSeriesData().map(jsonList => {
                        let xmlCoord: string = '';
                        // let xmlPoint: string = '';
                        jsonList.forEach((json) => {
                            xmlCoord += `${json.lng},${json.lat}\n`;
                            // xmlPoint += `<Placemark><name>point${j}</name><TimeStamp><when>${json.date}</when></TimeStamp><Point><coordinates>${json.lng},${json.lat},0</coordinates></Point></Placemark>`;
                        });

                        let color = hex2kmlcolor(jsonList[0].color);
                        let beginDate = jsonList[0].date;
                        let endDate = jsonList[jsonList.length - 1].date;
                        
                        return xmlFormat(`<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Trajectory</name><description>(c)2023 Tomoya Onuki. Generated by https://tomoya-onuki.github.io/locationDataGenerator/</description><Style id="line"><LineStyle><color>${color}</color><width>3</width></LineStyle></Style><Placemark><name>Trajectory</name><description>(c)2023 Tomoya Onuki. Generated by https://tomoya-onuki.github.io/locationDataGenerator/</description><TimeSpan><begin>${beginDate}</begin><end>${endDate}</end></TimeSpan><styleUrl>#line</styleUrl><LineString><extrude>1</extrude><tessellate>1</tessellate><altitudeMode>clampToGround</altitudeMode><coordinates>${xmlCoord}</coordinates></LineString></Placemark></Document></kml>`);
                    });
                } else {
                    let xmlPlace: string = '';
                    let xmlStyle: string = '';
                    // let xmlPoint: string = '';
                    this.timeSeriesData().forEach((jsonList, i) => {
                        let xmlCoord: string = '';
                        jsonList.forEach((json) => {
                            xmlCoord += `${json.lng},${json.lat}\n`;
                            // xmlPoint += `<Placemark><name>point${j}</name><TimeStamp><when>${json.date}</when></TimeStamp><Point><coordinates>${json.lng},${json.lat},0</coordinates></Point></Placemark>`;
                        });

                        let color = hex2kmlcolor(jsonList[0].color);
                        let beginDate = jsonList[0].date;
                        let endDate = jsonList[jsonList.length - 1].date;

                        xmlStyle += `<Style id="line${i}"><LineStyle><color>${color}</color><width>3</width></LineStyle></Style>`;

                        xmlPlace += `<Placemark><name>Trajectory ${i}</name><description>(c)2023 Tomoya Onuki. Generated by https://tomoya-onuki.github.io/locationDataGenerator/</description><TimeSpan><begin>${beginDate}</begin><end>${endDate}</end></TimeSpan><styleUrl>#line${i}</styleUrl><LineString><extrude>1</extrude><tessellate>1</tessellate><altitudeMode>clampToGround</altitudeMode><coordinates>${xmlCoord}</coordinates></LineString></Placemark>`;
                    });
                    return [xmlFormat(`<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Trajectory</name><description>(c)2023 Tomoya Onuki. Generated by https://tomoya-onuki.github.io/locationDataGenerator/</description>${xmlStyle}${xmlPlace}</Document></kml>`)];
                }
            case 'gpx':
                if (!integrate) {
                    return this.timeSeriesData().map(jsonList => {
                        let gpxTrkpt: string = '';
                        jsonList.forEach(json => {
                            gpxTrkpt += `<trkpt lat="${json.lat}" lon="${json.lng}"><time>${json.date}</time></trkpt>`;
                        });

                        let rgba = hex2gpxcolor(jsonList[0].color);

                        return xmlFormat(`<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="https://tomoya-onuki.github.io/locationDataGenerator/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/0"><metadata><name>Trajectory</name><desc>(c)2023 Tomoya Onuki. Generated by https://tomoya-onuki.github.io/locationDataGenerator/</desc><time>${dayjs().format('YYYY-MM-DD HH:mm:ss')}</time></metadata><trk><name></name><extensions><mytracks:color red="${rgba[0]}" green="${rgba[1]}" blue="${rgba[2]}" alpha="${rgba[3]}"></mytracks:color></extensions><trkseg>${gpxTrkpt}</trkseg></trk></gpx>`);
                    });
                } else {
                    let gpxTrek = '';
                    this.timeSeriesData().map((jsonList, i) => {
                        let gpxTrkpt: string = '';
                        jsonList.forEach(json => {
                            gpxTrkpt += `<trkpt lat="${json.lat}" lon="${json.lng}"><time>${json.date}</time></trkpt>`;
                        });

                        let rgba = hex2gpxcolor(jsonList[0].color);

                        gpxTrek += `<trk><name>Trajectory ${i}</name><extensions><mytracks:color red="${rgba[0]}" green="${rgba[1]}" blue="${rgba[2]}" alpha="${rgba[3]}"></mytracks:color></extensions><trkseg>${gpxTrkpt}</trkseg></trk>`;
                    });
                    return [xmlFormat(`<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="https://tomoya-onuki.github.io/locationDataGenerator/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/0"><metadata><name>Trajectory</name><desc>(c)2023 Tomoya Onuki. Generated by https://tomoya-onuki.github.io/locationDataGenerator/</desc><author><name>Tomoya Onuki</name></author><time>${dayjs().format('YYYY-MM-DD HH:mm:ss')}</time></metadata>${gpxTrek}</gpx>`)];
                }
            case 'gtfs': return [];
            case 'geojson': return this.geojson().map(geoJson => JSON.stringify(geoJson));
        }
        return [];
    }

    public geojson() {
        return this._trajGroupList.slice(0, -1).map(trajGroup => {
            let base = {
                'type': 'FeatureCollection',
                'features': trajGroup.baseTraj.feature()
            };
            let subList = trajGroup.subTrajListFeatures().map(feature => {
                return {
                    'type': 'FeatureCollection',
                    'features': feature
                };
            });
            return [base, ...subList];
        }).flat();
    }

    public timeSeriesData() {
        return this._trajGroupList.map(trajGroup => {
            if (!this._isInterpolation) {
                let baseColor = chroma(trajGroup.color).alpha(0.9).hex();
                let baseTrajJson = trajGroup.baseTraj.pointList.map((point, idx) => {
                    let date = trajGroup.baseTraj.dateList[idx];
                    return {
                        date: dayjs(date).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
                        lng: point.lng,
                        lat: point.lat,
                        color: baseColor
                    };
                });
                let subColor = chroma(trajGroup.color).alpha(0.2).hex();
                let subTrajJson = trajGroup.subTrajList.map(subTraj => {
                    return subTraj.pointList.map((point, idx) => {
                        let date = trajGroup.baseTraj.dateList[idx];
                        return {
                            date: dayjs(date).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
                            lng: point.lng,
                            lat: point.lat,
                            color: subColor
                        };
                    });
                });


                // return {
                //     base: baseTrajJson,
                //     sub: subTrajJson
                // }
                return [baseTrajJson, ...subTrajJson];
            }
            else {
                let savePointList = trajGroup.baseTraj.interpolationPointList;
                let dateList = trajGroup.baseTraj.dateList;

                // 時刻を持つ点間の分割数
                let div = savePointList.length / (dateList.length - 1);

                // 日付の補間
                let interpolateDateList: number[] = [];
                for (let i = 0; i < dateList.length - 1; i++) {
                    let date0 = dateList[i];
                    let date1 = dateList[i + 1];

                    if (i === dateList.length - 2) {
                        div--;
                    }

                    for (let j = 0; j < div; j++) {
                        let ratio = Math.ceil(j / div * 1000) / 1000;
                        if (j >= div - 1) {
                            ratio = 1.0;
                        }
                        interpolateDateList.push((date1 - date0) * ratio + date0);
                    }
                }

                let baseColor = chroma(trajGroup.color).alpha(0.9).hex();
                let baseTrajJson = savePointList.map((point, idx) => {
                    let date = interpolateDateList[idx];
                    return {
                        date: dayjs(date).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
                        lng: point.lng,
                        lat: point.lat,
                        color: baseColor
                    };
                });
                let subColor = chroma(trajGroup.color).alpha(0.2).hex();
                let subTrajJson = trajGroup.subTrajList.map(subTraj => {
                    let savePointList = subTraj.interpolationPointList;
                    return savePointList.map((point, idx) => {
                        let date = interpolateDateList[idx];
                        return {
                            date: dayjs(date).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
                            lng: point.lng,
                            lat: point.lat,
                            color: subColor
                        };
                    });
                });

                // return {
                //     base: baseTrajJson,
                //     sub: subTrajJson
                // }
                return [baseTrajJson, ...subTrajJson];
            }
        }).slice(0, -1).flat();

        // public csv() {
        //     return this._trajGroupList.map(trajGroup => {
        //         if (!this._isInterpolation) {
        //             let baseTrajJson = trajGroup.baseTraj.pointList.map((point, idx) => {
        //                 let date = trajGroup.baseTraj.dateList[idx];
        //                 return {
        //                     date: dayjs(date).format('YYYY-MM-DD_HH:mm:ss.SSS'),
        //                     lng: point.lng,
        //                     lat: point.lat,
        //                 };
        //             });
        //             let subTrajJson = trajGroup.subTrajList.map(subTraj => {
        //                 return subTraj.pointList.map((point, idx) => {
        //                     let date = trajGroup.baseTraj.dateList[idx];
        //                     return {
        //                         date: dayjs(date).format('YYYY-MM-DD HH:mm:ss.SSS'),
        //                         lng: point.lng,
        //                         lat: point.lat,
        //                     };
        //                 });
        //             });


        //             return {
        //                 base: baseTrajJson,
        //                 sub: subTrajJson
        //             }
        //         }
        //         else {
        //             let savePointList = trajGroup.baseTraj.interPolationPointList;
        //             let dateList = trajGroup.baseTraj.dateList;

        //             // 時刻を持つ点間の分割数
        //             let div = savePointList.length / (dateList.length - 1);

        //             // 日付の補間
        //             let interpolateDateList: number[] = [];
        //             for (let i = 0; i < dateList.length - 1; i++) {
        //                 let date0 = dateList[i];
        //                 let date1 = dateList[i + 1];

        //                 if (i === dateList.length - 2) {
        //                     div--;
        //                 }

        //                 for (let j = 0; j < div; j++) {
        //                     let ratio = Math.ceil(j / div * 1000) / 1000;
        //                     if (j >= div - 1) {
        //                         ratio = 1.0;
        //                     }
        //                     interpolateDateList.push((date1 - date0) * ratio + date0);
        //                 }
        //             }

        //             let baseTrajJson = savePointList.map((point, idx) => {
        //                 let date = interpolateDateList[idx];
        //                 return {
        //                     date: dayjs(date).format('YYYY-MM-DD_HH:mm:ss.SSS'),
        //                     lng: point.lng,
        //                     lat: point.lat,
        //                 };
        //             });
        //             let subTrajJson = trajGroup.subTrajList.map(subTraj => {
        //                 let savePointList = subTraj.interPolationPointList;
        //                 return savePointList.map((point, idx) => {
        //                     let date = interpolateDateList[idx];
        //                     return {
        //                         date: dayjs(date).format('YYYY-MM-DD_HH:mm:ss.SSS'),
        //                         lng: point.lng,
        //                         lat: point.lat,
        //                     };
        //                 });
        //             });

        //             return {
        //                 base: baseTrajJson,
        //                 sub: subTrajJson
        //             }
        //         }
        //     }).slice(0, -1);
    }
}