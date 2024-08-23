#!/bin/bash

rm -rf ./lambda_function.zip
rm -rf ./temp
mkdir temp/

# Install dependencies
pip install -r requirements.txt --target ./temp

# Copy your Lambda function code
cp lambda_function.py ./temp/


cd ./temp
zip -r9 ../lambda_function.zip .
cd ../
rm -rf ./temp

echo "Lambda function packaged as lambda_function.zip"
