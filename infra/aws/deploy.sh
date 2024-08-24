#!/bin/bash

cd event_stream_lambda
zip -r9 lambda_function.zip lambda_function.py
cd ../

cd event_stream_processor_lambda
./package_lambda.sh
cd ../

cd outbound_event_lambda
./package_lambda.sh
cd ../

terraform apply
