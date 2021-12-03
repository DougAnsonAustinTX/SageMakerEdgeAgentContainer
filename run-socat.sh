#!/bin/sh

#
# Socat Map Port
#
if [ -z ${MAP_PORT} ]; then
    export MAP_PORT="8235"
fi

#
# Sagemaker UDS Socket File
#
if [ -z ${SAGE_SOCKET_FILE} ]; then
    export SAGE_SOCKET_FILE="/tmp/sagemaker_edge_agent_example.sock"
fi

sudo socat TCP-LISTEN:${MAP_PORT},fork UNIX-CONNECT:${SAGE_SOCKET_FILE}
