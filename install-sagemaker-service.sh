#!/bin/sh

# Edge Agent Manager Version
# export EDGE_AGENT_VERSION="1.20210305"
export EDGE_AGENT_VERSION="1.20210820.e20fa3a"

# Platform Type
export PLATFORM_TYPE="`uname -m`"

# Install locations for the binary and provider library...
BIN_DIR=/usr/bin
SO_DIR=/usr/bin
PROVIDER_SO="libprovider_aws.so"

#
# Get the configured config env to source...
# 
# It should be structured like ./sagemaker-agent-pt/.env but filled in with valid values...
#
if [ -z "$1" ]; then
    CONFIG_ENV="./sagemaker-agent-pt/.env"
else
    CONFIG_ENV="$1"
fi 

#
# Make sure the config file exists
#
if [ ! -f ${CONFIG_ENV} ]; then
   echo "Usage: $0 <fully qualified path to config env file>"
   exit 1
else
   echo "Using Config Env file: "${CONFIG_ENV}
fi

#
# Bring in the configured environment
#
. ${CONFIG_ENV}

#
# Check for non-configured .env 
#
if [ "${SAPT_AWS_S3_BUCKET}" = "AWS_SAGEMAKER_S3_BUCKET_GOES_HERE" ]; then
    echo "Unable to install sagemaker service. ./sagemaker-agent-pt/.env not configured."
    exit 1
fi 

#
# Update the Neo Config file 
#
echo "Configuring neo_config.json..."
sed "s/CREATE_A_DEVICE_UUID/${SAPT_DEVICE_UUID}/g" < neo_config.json-template > neo_config.json-1
sed "s/SET_YOUR_FLEET_NAME/${SAPT_FLEET_NAME}/g" < neo_config.json-1 > neo_config.json-2
sed "s/AWS_REGION_GOES_HERE/${SAPT_AWS_REGION}/g" < neo_config.json-2 > neo_config.json-3
sed "s/AWS_SAGEMAKER_S3_BUCKET_NAME_GOES_HERE/${SAPT_AWS_S3_BUCKET}/g" < neo_config.json-3 > neo_config.json
rm ./neo_config.json-[123] > /dev/null 2>&1

#
# Update the agent.env file 
#
echo "Configuring agent.env..."
sed "s/SAGE_SOCKET_FILE/${SAPT_SAGE_SOCKET_FILE}/g" < agent.env.template > agent.env-1
sed "s/SAGE_MAX_PAYLOAD_ARGS/${SAPT_SAGE_MAX_PAYLOAD_ARGS}/g" < agent.env-1 > agent.env-2 
sed "s/NEO_CONFIG_FILE/${SAPT_NEO_CONFIG_FILE}/g" < agent.env-2 > agent.env
rm ./agent.env-[1] > /dev/null 2>&1

#
# Install the service (requires sudo)
#
if [ ! -d ./edge-agent-${EDGE_AGENT_VERSION}/bin/${PLATFORM_TYPE} ]; then
   echo "ERROR!  Unsupported platform(binary): ${PLATFORM_TYPE}.  Exiting..."
   exit 1
fi
if [ ! -d ./edge-agent-${EDGE_AGENT_VERSION}/lib/${PLATFORM_TYPE} ]; then
   echo "ERROR!  Unsupported platform(provider lib): ${PLATFORM_TYPE}.  Exiting..."
   exit 1
fi

# Models directory
echo "Creating models directory..."
INSTALL_DIR="`pwd`"
INSTALL_USER=${USER}
cd /
sudo rm -rf /models > /dev/null 2>&1
sudo tar xzpf ${INSTALL_DIR}/models_dir.tar.gz
sudo chown -R ${INSTALL_USER}.${INSTALL_USER} /models
cd ${INSTALL_DIR}

# Edge Agent Binary
echo "Copy the Sagemaker Edge Agent executable to ${BIN_DIR} for platform ${PLATFORM_TYPE}..."
sudo cp ./edge-agent-${EDGE_AGENT_VERSION}/bin/${PLATFORM_TYPE}/sagemaker_edge_agent_binary ${BIN_DIR}
sudo chown root.root ${BIN_DIR}/sagemaker_edge_agent_binary
sudo chmod 755 ${BIN_DIR}/sagemaker_edge_agent_binary

# Edge Agent Provider Library
if [ -f ./edge-agent-${EDGE_AGENT_VERSION}/lib/${PLATFORM_TYPE}/${PROVIDER_SO} ]; then
    echo "Copy the Sagemaker Edge Agent provider shared object to ${SO_DIR} for platform ${PLATFORM_TYPE}..."
    sudo cp ./edge-agent-${EDGE_AGENT_VERSION}/lib/${PLATFORM_TYPE}/${PROVIDER_SO} ${SO_DIR}
    sudo chown root.root ${SO_DIR}/${PROVIDER_SO}
    sudo chmod 755 ${SO_DIR}/${PROVIDER_SO}
else 
    echo "Skipping provider libary - not supplied in version ${EDGE_AGENT_VERSION} - OK. Continuing..."
fi

# Environment
echo "Copy agent.env to /etc..."
sudo cp ./agent.env /etc/sagemaker_agent.env
sudo chown root.root /etc/sagemaker_agent.env
sudo chmod 644 /etc/sagemaker_agent.env

# Configuration
echo "Copy neo_config.json to /etc..."
sudo cp ./neo_config.json /etc/neo_config.json
sudo chown root.root /etc/neo_config.json
sudo chmod 644 /etc/neo_config.json

# Patch up some L4T/NV/Sagemaker issues
CURR_DIR="`pwd`"
if [ "${PLATFORM_TYPE}" = "aarch64" -a ! -f /usr/lib/${PLATFORM_TYPE}-linux-gnu/libnvinfer.so.7 ]; then
    echo "Adding some symbolic links for key shared libraries"
    cd /usr/lib/${PLATFORM_TYPE}-linux-gnu/
    sudo ln -s  libnvinfer.so.8   libnvinfer.so.6
    sudo ln -s libnvparsers.so.8  libnvparsers.so.6
    sudo ln -s libnvinfer.so.8 libnvinfer.so.7
    cd ${CURR_DIR}
elif [ "${PLATFORM_TYPE}" = "aarch64" ]; then
    echo "/usr/lib/${PLATFORM_TYPE}-linux-gnu/libnvinfer.so.7 found. No need to patch (OK)."
else 
    echo "No need to patch platform ${PLATFORM_TYPE} (OK)."
fi

# Systemd Service
echo "Copying sagemaker_edge_agent.service to /etc/systemd/system..."
sudo cp sagemaker_edge_agent.service /etc/systemd/system/

#
# Enable and Start the service
#
echo "Enabling sagemaker_edge_agent.service..."
echo "sudo systemctl enable sagemaker_edge_agent.service"
sudo systemctl enable sagemaker_edge_agent.service
echo "Starting sagemaker_edge_agent.service..."
echo "sudo systemctl start sagemaker_edge_agent.service"
sudo systemctl start sagemaker_edge_agent.service

#
# Clean Up
#
echo "Cleaning Up..."
rm agent.env neo_config.json > /dev/null 2>&1

#
# Validate that the service has now started
#
echo "Getting sagemaker_edge_agent.service status...(ctrl-c to quit)"
echo "systemctl status sagemaker_edge_agent.service"
systemctl status sagemaker_edge_agent.service
