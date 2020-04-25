import OSRM from 'osrm';

export interface Coordinate {
    longitude: string;
    latitude: string;
}

export interface Request extends OSRM.Options {
    id: string | number;
    extra?: {[key: string]: any};
    coordinates: any | Coordinate[];
}

export interface Result extends OSRM.Route {
    id: string | number;
}