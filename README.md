# BigQuery Geo Router

Converts long/lat coordinates in BigQuery into routes generated using [OpenStreetMap data](https://www.openstreetmap.org/) and the [Open Source Routing Machine](http://project-osrm.org/).

The resulting data can be loaded back into BigQuery for further analysis - each route is typed appropriately to be used with BigQuery's [geospatial querying functionality](https://cloud.google.com/bigquery/docs/reference/standard-sql/geography_functions). 

## Usage

### Setup

The first step is to download and prepare the OpenStreetMap data for the region you're interested in calculating routes for.

[Geofabrik](https://download.geofabrik.de/) has a number of regional OpenStreetMap extracts that can be used as our starting point. The included Cloud Build config, `cloudbuild-setup.yaml`, takes care of many the of steps you need to get everything set up.

The two main parameters needed for the Cloud Build job are `_OSM_NAME` and `_BUCKET`.

- `_OSM_NAME`: this is the name, including any prefixes, for the OpenStreetMap data file available from Geofabrik (the Cloud Build job is configured to download extracts from this location). The example below is referencing the data for Illinois available [here](https://download.geofabrik.de/north-america/us/illinois.html) (note the URL path and its correlation to `_OSM_NAME`).
- `_BUCKET`: the name of the Google Cloud Storage bucket where the resulting files will be saved and referenced when calculating routes.


```bash
gcloud builds submit \
    --config cloudbuild-setup.yaml \
    --substitutions=_OSM_NAME=north-america/us/illinois \
    --substitutions=_BUCKET=gs://my-bucket-for-storing-routing-data
```

### Generating Routes

Once the above step is complete, routes can be calculated by running (another) Cloud Build job. The job builds a Docker container containing a Node.js application that queries BigQuery and runs the routing calculation process. The application saves the routes to a local JSON file that are then be loaded back into BigQuery.

The input to the ronute calculator can either be a reference to a table in BigQuery (in the format `dataset.table`) or the path to a SQL file.

```bash
gcloud builds submit \
    --config cloudbuild.yaml \
    --substitutions=_OSM_NAME=north-america/us/illinois \
    --substitutions=_BUCKET=gs://my-bucket-for-storing-routing-data
    --substitutions=_DESTINATION_DATASET_=trip_routes \
    --substitutions=_INPUT_TABLE=trip_routes.trips
```

## Visualising Routes

TBC

## Configuring OSRM

TBC