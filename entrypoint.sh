#!/bin/sh
if [ -z "$1" && -f "/app/dist/http.js" ]; then
    # run HTTP server if no input arguments
    node /app/dist/http.js
else
    # otherwise run route calculator
    node /app/dist/index.js "$@"
fi