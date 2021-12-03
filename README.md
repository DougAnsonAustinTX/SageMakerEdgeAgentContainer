## Dockerized SageMaker Edge Agent Manager

# Overview

This repo implements a containerized Pelion Edge Protocol Translator (PT) that defines a "device" where the device is actually an instance of the AWS Sagemaker Edge Agent running in the container. The PT defines a LWM2M resource (typically /33311/0/5701) that you can POST JsonRPC v2.0 compatible commands to interact with the Sagemaker agent running in the container. The supported JsonRPC commands are listed below. 

This prototype is designed to run on Nvidia Jetson Xavier NX platforms running L4T JetPack 4.5 or later with Pelion Edge installed.
Please see [https://github.com/PelionIoT/XavierPelionEdge](https://github.com/PelionIoT/XavierPelionEdge) for more information.

This repo assumes that you are creating ML models in Sagemaker. S3 buckets created by Sagemaker will be referenced in the configuration details below. 

# Installation

1). Clone this repo on your Pelion-Edge enabled Xavier Gateway running L4T:

	xavier% git clone https://github.com/PelionIoT/SageMakerEdgeAgentContainer
	xavier% cd ./SageMakerEdgeAgentContainer

2). Customize ./sagemaker-agent-pt/.env (save to a new file - say ${HOME}/myenv.env for step 3)):

	#
	# You will need to set/customize each of these 
	#
	if [ -z "${SAPT_AWS_ACCESS_KEY_ID}" ]; then
		export SAPT_AWS_ACCESS_KEY_ID="AWS_ACCESS_KEY_GOES_HERE"
	fi
	
	if [ -z "${SAPT_AWS_SECRET_ACCESS_KEY}" ]; then
	    export SAPT_AWS_SECRET_ACCESS_KEY="AWS_SECRET_ACCESS_KEY_GOES_HERE"
	fi
	
	if [ -z "${SAPT_AWS_S3_BUCKET}" ]; then
	    export SAPT_AWS_S3_BUCKET="AWS_SAGEMAKER_S3_BUCKET_GOES_HERE"
	fi
	
	if [ -z "${SAPT_AWS_S3_MODELS_DIR}" ]; then
	    export SAPT_AWS_S3_MODELS_DIR="S3_DIR_WHERE_SAGEMAKER_SAVES_COMPILED_MODELS"
	fi
	
	if [ -z "${SAPT_AWS_S3_DATA_DIR}" ]; then
	    export SAPT_AWS_S3_DATA_DIR="S3_DIR_WHERE_SAGEMAKER_STORES_INPUT_AND_OUTPUT_DATA"
	fi
	
	NOTE:  for the two "DIR" options above, please escape the directory slash like this:
	
		export SAPT_AWS_S3_MODELS_DIR="DEMO-Sagemaker-Edge\/compilation-output"

3). Setup the shared models directory on the Xavier/L4T Pelion Edge gateway:

	xavier% sudo tar xzpf models_dir.tar.gz
	xavier% sudo chown -R ${USER}.${USER} models
	xavier% sudo mv models /
	xavier% sudo ls -al /models

4). Install Sagemaker Edge Agent as a systemd service on your Xavier/L4T Pelion Edge gateway (will require sudo):

	xavier% ./install-sagemaker-service.sh ${HOME}/myenv.env
	
Now, you should be able to confirm that that sagemaker agent service is running OK. You can "tail" the sagemaker service logs:

	xavier% ./tail-sagemaker.sh


5). Copy and edit the "edge-agent.yaml" file and set the following (save to ${HOME}/my-edge-agent.yaml for below):

	 - name: SAPT_AWS_REGION
      value: "YOUR_AWS_REGION_GOES_HERE"
      
    - name: SAPT_AWS_ACCESS_KEY_ID
      value: "YOUR_AWS_ACCESS_KEY_GOES_HERE"
      
    - name: SAPT_AWS_SECRET_ACCESS_KEY
      value: "YOUR_AWS_SECRET_ACCESS_KEY_GOES_HERE"
      
    - name: SAPT_AWS_S3_BUCKET
      value: "YOUR_AWS_SAGEMAKER_S3_BUCKET_GOES_HERE"
      
    - name: SAPT_AWS_S3_MODELS_DIR
      value: "YOUR_S3_DIR_WHERE_SAGEMAKER_SAVES_COMPILED_MODELS"
      
    - name: SAPT_AWS_S3_DATA_DIR
      value: "YOUR_S3_DIR_WHERE_SAGEMAKER_STORES_INPUT_AND_OUTPUT_DATA"
      
6). Within "edge-agent.yaml", also replace "MVS\_PELION\_GW\_DEVICE\_ID" with the actual Pelion device ID of your gateway: 

		nodeName: MVS_PELION_GW_DEVICE_ID
		
7). Also within "edge-agent.yaml", provide the target machine type your Pelion gateway is by replacing
    SAPT\_UNAME\_M\_GOES\_HERE  with either "x86_64", "aarch64", "armhf", "arm64" (the currently supported types...)

       image: "danson/edgeagentimage-SAPT_UNAME_M_GOES_HERE:latest"
       
   Note: The currently supported machine types:
     
   - "x86_64" is typical for Intel-based gateways. 
  
   - "aarch64" is for arm-based Nvidia Jetson boards. 
  
   - "arm64" is for raspberry pi4 running 64bit linux. 
  
   - "armhf" is for older raspberry pi2/3 with 32bit linux.
   
Additionally, you can change the PT device name by modifying this portion of "edge-agent.yaml"
   
   		- name: SAPT_PT_DEVICE_NAME
      	  value: "sagemaker-edge-agent" 
		
7). Deploy the Pelion Sagemaker PT Container (typically on my Mac, not my Xavier Gateway):
 
	mac% kubectl create -f ${HOME}/my-edge-agent.yaml


# Supported API Calls from Pelion Sagemaker PT:

The following JsonRPC v2.0 examples illustrate the compatible calls currently supported:

	List loaded models in the sagemaker agent:
	
		{"jsonrpc":"2.0","id":"1","method":"listModels"}
	
	Load a model into the sagemaker agent (NOTE: s3_filename is the compiled output filename of a model from Sagemaker):
	
		{"jsonrpc":"2.0","id":"1","method":"loadModel","params":{"name":"demo-keras","s3_filename":"keras-model-1.0.tar.gz"}}
	
	Unload a loaded model in the sagemaker agent:
	
		{"jsonrpc":"2.0","id":"1","method":"unloadModel","params":{"name":"demo-keras"}}
	
	Perform a prediction with input data that is local (typically /models on the gateway) with results stored locally:
	
		{"jsonrpc":"2.0","id":"1","method":"predict","params":{"model_name":"demo-keras","input_data_url":"file:///keras.bmp","output_url":"file:///keras-predicted.data" }}
	
	Perform a prediction with input data from S3 with results stored back in S3:
	
		{"jsonrpc":"2.0","id":"1","method":"predict","params":{"model_name":"demo-keras","input_data_url":"s3:///keras.bmp","output_url":"s3:///keras-predicted.data"}}
	
NOTES:  
  1). In the prediction calls above, the file:// and s3:// contain no path information. That is because the intermediate path/directory information is part of the container configuration (/models for local data, SAPT\_AWS\_S3\_MODELS\_DIR and SAPT\_AWS\_S3\_DATA\_DIR for S3 stored data).
