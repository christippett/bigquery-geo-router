#!/bin/sh -ex

#
# BigQuery dynamic file loader
#
# The following shell command finds and uploads all local route/match results files to BigQuery, assuming the following conditions are met:
#   - results files follow the naming convention of "<service>_results_<YYYYMMDDhhmm>.json" in order to extract the appropriate table name and
#     schema definition.
#   - assumes BigQuery's schema JSON files are located in the ./schemas directory relative to the current working directory.
#
# Example usage:
#   ./scripts/bq-load-helper.sh \
#     --dataset_id=trip_routes \
#     --replace \
#     --source_format=NEWLINE_DELIMITED_JSON \
#     --ignore_unknown_values
#

args="$@"

echo $args

ls -d results/* | grep 'route\|match' | xargs -I{} echo {} \
    | awk '{ n=split($1,A,"/"); q=split(A[n],B,"."); o=split(A[n],C,"_"); print ""B[1]" " $0 " ./schemas/"C[1]".json" }' \
    | xargs -I{} sh -c "bq load ${args} {}"
