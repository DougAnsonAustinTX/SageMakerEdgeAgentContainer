#!/bin/sh

export EDGE_AGENT_VERSION="1.20210820.e20fa3a"
export SAGE_SOCKET_FILE="/tmp/sagemaker_edge_agent_example.sock"
export NEO_CONFIG_FILE="${HOME}/neo_config.json"
export DEMO="${HOME}/SageMakerEdgeAgentContainer/demo"
export BINARY="${HOME}/SageMakerEdgeAgentContainer/edge-agent-${EDGE_AGENT_VERSION}/bin/sagemaker_edge_agent_binary"

echo "Launching edge-agent Address: unix://"${SAGE_SOCKET_FILE} " Config: "${NEO_CONFIG_FILE} 
cd ${DEMO}
sudo ${BINARY} -a ${SAGE_SOCKET_FILE} -c ${NEO_CONFIG_FILE}
