SELECT
  unique_key AS id
  ,[
    STRUCT(pickup_longitude AS longitude, pickup_latitude AS latitude),
    STRUCT(dropoff_longitude AS longitude, dropoff_latitude AS latitude)
   ] AS coordinates
  ,[
      UNIX_SECONDS(trip_start_timestamp),
      UNIX_SECONDS(trip_end_timestamp)
   ] AS timestamps
  ,STRUCT(
    taxi_id
    ,trip_start_timestamp
    ,trip_end_timestamp
    ,trip_seconds / 60 AS trip_duration_minutes
    ,ROUND(ST_Distance(ST_GEOGPOINT(pickup_longitude, pickup_latitude), ST_GEOGPOINT(dropoff_longitude, dropoff_latitude)), 2) AS trip_distance_meters
  ,ST_GEOGPOINT(pickup_longitude, pickup_latitude) AS trip_start_point
  ,ST_GEOGPOINT(dropoff_longitude, dropoff_latitude) AS trip_end_point
  ) AS extra
FROM
  `bigquery-public-data.chicago_taxi_trips.taxi_trips` t
WHERE
  (trip_seconds*1.0 / 60) BETWEEN 7 AND 10
  AND ST_Distance(ST_GEOGPOINT(pickup_longitude, pickup_latitude), ST_GEOGPOINT(dropoff_longitude, dropoff_latitude)) > 2000
  AND DATE(trip_start_timestamp) = "2013-01-10"
ORDER BY
  trip_start_timestamp DESC
LIMIT 200