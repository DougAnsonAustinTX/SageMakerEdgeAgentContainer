#!/bin/sh

set -x

sudo systemctl disable sagemaker_edge_agent.service
sudo systemctl stop sagemaker_edge_agent.service
sudo rm /etc/neo_config.json > /dev/null 2>&1
sudo rm /etc/sagemaker_agent.env > /dev/null 2>&1
sudo rm /usr/bin/sagemaker_edge_agent_binary > /dev/null 2>&1
sudo rm /usr/bin/libprovider_aws.so > /dev/null 2>&1
sudo rm /etc/systemd/system/sagemaker_edge_agent.service > /dev/null 2>&1
sudo rm -rf /models > /dev/null 2>&1
