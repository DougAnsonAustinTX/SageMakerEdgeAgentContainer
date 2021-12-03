#!/bin/sh

if [ -f ./sagemaker-agent-pt.js ]; then
    node sagemaker-agent-pt.js
else
    echo "Unable to launch PT - file not found"
fi
