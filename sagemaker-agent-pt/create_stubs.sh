#!/bin/sh

# brew install protobuf
protoc --proto_path=. --grpc_js_out=import_style=commonjs,binary:. --js_out=import_style=commonjs,binary:. agent.proto 
