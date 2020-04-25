import util from 'util';
import formatter from 'format-number';
import { BigQuery, Query, Job } from '@google-cloud/bigquery';
import { LineString, MultiLineString } from 'geojson';

export const exec = util.promisify(require('child_process').exec);
export const numberFormatter = formatter({ padLeft: 8, integerSeparator: " " });

export function isValidGeoJson(geometry: LineString | MultiLineString): boolean {
    // Check coordinates array for duplicates
    const uniqueCoordinates = new Set();
    for (const coords of geometry.coordinates) {
        uniqueCoordinates.add((coords[0] as number) * (coords[1] as number));
    }
    return uniqueCoordinates.size > 1;
}

export async function executeQuery(bigquery: BigQuery, query: string, options: Query): Promise<Job> {
    const [job] = await bigquery.createQueryJob({
        query,
        location: bigquery.location,
        ...options,
    });
    return job;
}