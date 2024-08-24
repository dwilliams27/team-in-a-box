#!/bin/bash

rm -rf ./lambda_function.zip
rm -rf ./temp
mkdir temp/

pip install -r requirements.txt --target ./temp
cp lambda_function.py ./temp/

cd ./temp
zip -r9 ../lambda_function.zip .
cd ../
rm -rf ./temp

echo -e "\033[32mDone packaging \033[33moutbound_event_lambda\033[0m"
