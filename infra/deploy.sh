#!/bin/bash

zip event_stream_lambda/lambda_function.zip event_stream_lambda/lambda_function.py

cd event_stream_processor_lambda
./package_lambda.sh
cd ../

terraform apply
