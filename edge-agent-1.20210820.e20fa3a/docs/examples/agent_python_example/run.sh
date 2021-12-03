#!/bin/bash

pip3 install -r requirements.txt
python3 -m grpc_tools.protoc --proto_path=. --python_out=. --grpc_python_out=. agent.proto
python3 example.py --model_url $1 --model_name $2 --image_tensor_name $3 --image_path $4
