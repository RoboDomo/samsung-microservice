#!/usr/bin/env bash

# run container without making it a daemon - useful to see logging output
docker run \
    --rm \
    --name="samsung-microservice" \
    -e "MQTT_HOST=$MQTT_HOST" \
    -v $PWD:/home/app \
    robodomo/samsung-microservice
