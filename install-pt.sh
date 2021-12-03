#!/bin/sh

if [ -d ./sagemaker-agent-pt ]; then
    cd ./sagemaker-agent-pt
    if [ -x ./install-local.sh ]; then
        ./install-local.sh
    else 
	echo "No install script found. Unable to install PT"
    fi
    cd ..
else
   echo "Sagemaker PT directory not found. Unable to install PT"
fi
