#!/bin/bash

# Create a temporary directory for packaging
TEMP_DIR=$(mktemp -d)

# Ensure cleanup on script exit
trap "rm -rf $TEMP_DIR" EXIT

# Install dependencies
pip install -r requirements.txt --target $TEMP_DIR

# Copy your Lambda function code
cp lambda_function.py $TEMP_DIR/

# Create the zip file
ZIP_DIR=$(pwd)
cd $TEMP_DIR
zip -r9 $ZIP_DIR/lambda_function.zip .

echo "Lambda function packaged as lambda_function.zip"
