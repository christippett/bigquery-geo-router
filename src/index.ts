import os from 'os';
import fs from 'fs';
import path from 'path';
import moment from 'moment';
import polyline from '@mapbox/polyline';
import through2 from 'through2';
import { BigQuery, BigQueryOptions } from '@google-cloud/bigquery';
import { ResourceStream } from '@google-cloud/paginator';
import { LineString, MultiLineString } from 'geojson';
import * as utils from './utils';
import { Request, Result, Coordinate } from './interfaces';

process.env.UV_THREADPOOL_SIZE = String(Math.ceil(os.cpus().length * 1.5));
import OSRM from 'osrm';

const osrmDataPath: string = process.env.OSRM_DATA_DIR || 'data/data.osrm';
const bqOptions: BigQueryOptions = {
    projectId: process.env.PROJECT_ID,
    location: 'US', // or 'australia-southeast1'
};


class RouteCalculator {
    private bigquery: BigQuery;
    private osrm: OSRM;


    constructor(osrmDataPath: string, bqOptions: BigQueryOptions) {
        this.bigquery = new BigQuery(bqOptions);
        this.osrm = new OSRM({ path: osrmDataPath, algorithm: 'MLD' } as any);
    }

    async run (service: string, inputData: string) {
        console.log('\n#############################');
        console.log("#  STARTING ROUTE ANALYSIS  #");
        console.log('#############################\n');

        const processStartTime = moment().utc().startOf('minute');

        if (!fs.existsSync('results')) fs.mkdirSync('results');
        const resultsFilename = `${service}_results_${processStartTime.format("YYYYMMDDHHMM")}.json`;
        const resultsStream = fs.createWriteStream(path.join("results", resultsFilename), { 'flags': 'w' });

        const data: ResourceStream<Request> = await this.getData(inputData);

        let i = 0;
        data.pipe(through2.obj((req: Request, enc, next) => {
            i++;
            if (i % 10000 === 0) console.log(`Rows processed: ${utils.numberFormatter(i)}`);

            req.coordinates = req.coordinates.map((c: Coordinate) => [Number(c.longitude), Number(c.latitude)]);

            switch (service) {
                case "route":
                    this.calculateRoutes({ req, writeStream: resultsStream })
                    break;
                case "match":
                    this.calculateMatches({ req, writeStream: resultsStream })
                    break;

                default:
                    throw new Error("Invalid service, available options are 'route' or 'match'");
            }

            next();
        }));

        data.on('end', async () => {
            console.log(`Rows processed: ${utils.numberFormatter(i)}`);
            console.log("Done!");
        });


    }

    private async calculateRoutes ({ req, writeStream }: { req: Request; writeStream: fs.WriteStream; }) {

        const options: OSRM.RouteOptions = {
            steps: true,
            overview: 'full',
            geometries: 'polyline',
            ...req as OSRM.RouteOptions
        }
        this.osrm.route(options, (err, response: OSRM.RouteResults) => {
            if (err) return;
            for (const i in response.routes) {
                if (!response.routes.hasOwnProperty(i)) continue;
                const route: OSRM.Route = response.routes[i];
                this.convertRouteGeometries(route);
                const result: Result = {
                    id: req.id,
                    ...route
                }

                writeStream.write(JSON.stringify(result) + '\n');
            }
        });
    }

    private async calculateMatches ({ req, writeStream }: { req: Request; writeStream: fs.WriteStream; }) {

        const options: OSRM.MatchOptions = {
            steps: true,
            overview: 'full',
            geometries: 'polyline',
            ...req as OSRM.MatchOptions
        }
        this.osrm.match(options, (err, response: OSRM.MatchResults) => {
            if (err) return;
            for (const i in response.matchings) {
                if (!response.matchings.hasOwnProperty(i)) continue;
                const route: OSRM.MatchRoute = response.matchings[i];
                this.convertRouteGeometries(route);
                const result: Result = {
                    id: req.id,
                    ...route
                }
                writeStream.write(JSON.stringify(result) + '\n');
            }
        });
    }

    private async getData (inputData: string): Promise<ResourceStream<Request>> {
        console.log("Getting input data");
        if (inputData.endsWith(".sql")) {
            const query = fs.readFileSync(inputData).toString();
            const [job] = await this.bigquery.createQueryJob({ query });
            return job.getQueryResultsStream();
        } else {
            const [datasetRef, tableRef] = inputData.split(".");
            const dataset = this.bigquery.dataset(datasetRef);
            const table = dataset.table(tableRef);
            return table.createReadStream()
        }
    }

    private convertRouteGeometries (route: OSRM.Route | OSRM.MatchRoute) {
        route.geometry = this.convertGeometryToGeoJSON(route.geometry);
        route.legs.forEach(leg => {
            leg.steps.forEach(step => {
                step.geometry = this.convertGeometryToGeoJSON(step.geometry) as string
            });
        });
    }

    private convertGeometryToGeoJSON (geometry: string | OSRM.LineString): string | null {
        const routeGeoJson: LineString | MultiLineString = polyline.toGeoJSON(geometry);
        return utils.isValidGeoJson(routeGeoJson) ? JSON.stringify(routeGeoJson) as "geojson" : null;
    }
}



async function main () {
    const service = process.argv[2] || 'route';
    const inputData = process.argv[3] || 'query.sql';
    console.debug(`Query input table reference / file path: ${inputData}`);
    console.debug(`OSRM data path: ${osrmDataPath}`);
    const routeCalculator = new RouteCalculator(osrmDataPath, bqOptions);
    await routeCalculator.run(service, inputData);
}

main();
