#!/bin/sh
sudo cloud-build-local \
    --config=cloudbuild.yaml \
    --dryrun=false \
    --substitutions=_OSM_NAME=north-america/us/illinois \
    --substitutions=_BUCKET=gs://my-bucket-for-storing-routing-data \
    --bind-mount-source .