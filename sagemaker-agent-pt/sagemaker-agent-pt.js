/*
 * ----------------------------------------------------------------------------
 * Copyright 2020 ARM Ltd.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 */

const util = require('util')

const JsonRpcWs = require('json-rpc-ws');

// UUID
const { v4: uuidv4 } = require('uuid');

// path support
var path = require('path');

// Sleep support
const sleep = require('system-sleep');

// mqtt support
const mqtt = require('mqtt');

// Configuration support
require('dotenv').config();

// URL support
const urlParser = require('url');

// Local Filesystem file read support
const fs = require('fs');

// AWS S3 bucket file read support
var AWS = require('aws-sdk');

// btoa support
const btoa = require('btoa');
const atob = require('atob');

// Sagemaker Edge Agent API
const grpc = require('grpc');
const sagemakerAgentServices = require('./agent_grpc_pb');
const sagemakerAgentMessages = require('./agent_pb');
const { request } = require('http');

// exec support
const { exec } = require("child_process");

// VERSION
const VERSION = "1.0.0";

// CONFIG

// File reading support - relative to mapped kubernetes mount points
const LOCAL_DIR = "/models";
const DATA_FILE_DIR = LOCAL_DIR + "/" + "data";
const AWS_REGION = "us-east-1";        

// Sagemaker Edge Agent RPC API Object ID
const SAGEMAKER_EDGE_AGENT_RPC_API_OBJECT_ID = 33311;

// Sagemaker Edge Agent RPC API Resource ID
const SAGEMAKER_EDGE_AGENT_RPC_API_RESOURCE_ID = 5701;

// Sagemaker Edge Agent CONFIG Resource ID
const SAGEMAKER_EDGE_AGENT_CONFIG_RESOURCE_ID = 5702;

// Sagemaker Edge Agent RPC Invocatio Status Resource ID
const SAGEMAKER_EDGE_AGENT_RPC_INVOKE_STATUS_RESOURCE_ID = 5703;

// Sagemaker Socat map port
const MAP_PORT = 8235

// Default JSON RPC Command
const DEFAULT_JSON_RPC_COMMAND = {};

// MQTT configuration
const MQTT_BROKER_HOSTNAME              = "127.0.0.1";                              // use the mosquitto instance in the docker host...
const MQTT_BROKER_PORT                  = 1883;                                     // std port number
const MQTT_COMMAND_TOPIC                = "command";                                // command topic
const MQTT_CLIENT_ID                    = "videoCapture";                           // clientId to use
const MQTT_USERNAME                     = "arm";                                    // default username (changeme)
const MQTT_PASSWORD                     = "changeme";                               // default password (changeme)

// Supported Commands - these should align with those calls in seatpapi 
const SUPPORTED_COMMANDS = 
    {
        "listModels": {"params":[]},                                                                        // listModels()
        "loadModel": {"params":["name","s3_filename"]},                                                     // loadModel()
        "describeModel": {"params":["name"]},                                                               // describeModel()
        "reloadModel": {"params":["name","s3_filename"]},                                                   // reloadModel()
        "unloadModel": {"params":["name"]},                                                                 // unloadModel()
        "predict": {"params":["model_name","input_data_url","output_url","capture_enable","aux_data"]},     // predict() (...and capture with opt AuxData)
        "getDataCaptureStatus": {"params":["capture_id"]},                                                  // getCaptureDataStatus()
        "aux_data": {"params":["name","encoding","b64_data"]}                                               // AuxData (non-command,structure-only)
    };

// Timeout time in milliseconds
const TIMEOUT = 10000;

// CoAP Operations
const OPERATIONS = {
    READ       : 0x01,
    WRITE      : 0x02,
    EXECUTE    : 0x04,
    DELETE     : 0x08
};

// Logging Levels
const LOGGING = {
    INFO        : 0x01,
    DEBUG       : 0x02,
    ERROR       : 0x04
};

// Command Status
const CMD_STATUS = {
    IDLE        : 'idle',
    RUNNING     : 'running',
    ERROR       : 'error'
};

// SIGINT handler
let sigintHandler;

// PT handle
let pt;

function SagemakerEdgeAgentPT(MAP_PORT, LOG_LEVEL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_S3_MODELS_DIR, AWS_S3_DATA_DIR, AWS_REGION, PT_DEVICE_NAME) {
    try {
        this.name = 'sagemaker-edge-agent';
        this.mapPort = MAP_PORT;
        this.log_level = LOG_LEVEL;
        this.awsRegion = AWS_REGION;

        // initialize our last command status...
        this.commandStatus = {};

        // define our PT device name 
        if (PT_DEVICE_NAME !== undefined && PT_DEVICE_NAME !== "") {
            this.name = PT_DEVICE_NAME;
        }
        this.ptDeviceName = this.name + "-0"
        
        // Build out our configuration
        this.config = {};
        this.config['config'] = {};
        this.config['config']['version'] = VERSION;
        this.config['config']['auth'] = {};
        this.config['config']['auth']['awsAccessKeyId'] = AWS_ACCESS_KEY_ID;
        this.config['config']['auth']['awsSecretAccessKey'] = AWS_SECRET_ACCESS_KEY;
        this.config['config']['awsS3Bucket'] = AWS_S3_BUCKET;
        this.config['config']['awsS3ModelsDirectory'] = AWS_S3_MODELS_DIR;
        this.config['config']['awsS3DataDirectory'] = AWS_S3_DATA_DIR;
        this.config['config']['awsRegion'] = AWS_REGION;
        this.config['config']['commands'] = SUPPORTED_COMMANDS;

        // MQTT config
        this.config['config']['mqttBrokerHost'] = MQTT_BROKER_HOSTNAME;
        this.config['config']['mqttBrokerPort'] = MQTT_BROKER_PORT;
        this.config['config']['mqttUsername'] = MQTT_USERNAME;
        this.config['config']['mqttPassword'] = MQTT_PASSWORD;
        this.config['config']['mqttClientId'] = MQTT_CLIENT_ID;

        // set the region for AWS S3 support
        AWS.config.update({region: this.config['config']['awsRegion']});

        // Edge JsonRPC Config and setup
        this.api_path = '/1/pt';
        this.socket_path = '/tmp/edge.sock';
        this.client = JsonRpcWs.createClient();

        // Tensor Debug
        this.debug_tensor_count = 100;

        // MQTT configuration
        this.mqttClient = undefined;
        this.mqttUrl = "";
        this.mqttOptions = {};
        this.mqttConnected = false;
        this.updateMQTTConfiguration(this);

        // Sagemaker gRPC Config and setup 
        this.sagemaker_sock = 'dns:///localhost:'+ this.mapPort;
        this.log(LOGGING.INFO,"Connecting to SagemakerAgentServices at: " + this.sagemaker_sock);
        this.sage_client = new sagemakerAgentServices.AgentClient(this.sagemaker_sock, grpc.credentials.createInsecure());
        this.log(LOGGING.INFO,"Sagemaker Protocol Translator created successfully: Name: " + this.ptDeviceName);
    }
    catch(ex) {
        this.log(LOGGING.ERROR,"Caught Exception in SagemakerEdgeAgentPT Constructor: ", ex);
    }
}

SagemakerEdgeAgentPT.prototype.updateMQTTConfiguration = function(mypt) {
    // update our options...
    mypt.mqttUrl = `mqtt://${mypt.config['config']['mqttBrokerHost']}:${mypt.config['config']['mqttBrokerPort']}`;
    mypt.mqttOptions = {
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
        // clientId: pt.config['config']['mqttClientId'],
        // username: pt.config['config']['mqttUsername'],
        // password: pt.config['config']['mqttPassword'],
    };

    // reconnect...
    mypt.connectToMQTTBroker(mypt);
}

SagemakerEdgeAgentPT.prototype.doLog = function(level) {
    if (this.log_level.includes(level)) {
        return true;
    }
    return false;
}

SagemakerEdgeAgentPT.prototype.log = function(level, message) {
    let str_level = "INFO";

    switch(level) {
        case LOGGING.DEBUG:
            str_level = "DEBUG";
            break;
        case LOGGING.ERROR:
            str_level = "ERROR";
            break;
    }

    // create the JSON log entry
    const data = {};
    data['level'] = str_level;
    data['message'] = message;
    data['ts'] = new Date().toISOString();

    // log to console
    if (this.doLog(str_level)) {
        console.log(data);
    }
}

SagemakerEdgeAgentPT.prototype.localModelDestinationURL = function(jsonrpc) {
    return LOCAL_DIR;
}

SagemakerEdgeAgentPT.prototype.connect = async function() {
    let self = this;
    return new Promise((resolve, reject) => {
        let url = util.format('ws+unix://%s:%s',
                              this.socket_path,
                              this.api_path);
        if (self.client.isConnected() === false) {
            pt.log(LOGGING.INFO,'Connecting Edge at: ' + url + '...');
            self.client.connect(url,
                function connected(error, reply) {
                    if (!error) {
                        resolve(self);
                    } else {
                        reject(error);
                    }
                });
            }
    });
};

SagemakerEdgeAgentPT.prototype.disconnect = async function() {
    let self = this;
    return new Promise((resolve, reject) => {
        pt.log(LOGGING.INFO,'Disconnecting from Edge.');
        self.client.disconnect((error, response) => {
            if (!error) {
                resolve(response);
            } else {
                reject(error);
            }
        });
    });
};

SagemakerEdgeAgentPT.prototype.registerSagemakerEdgeAgentProtocolTranslator = async function() {
    let self = this;
    return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
            reject('Timeout');
        }, TIMEOUT);

        self.client.send('protocol_translator_register', { 'name': self.name },
            function(error, response) {
                clearTimeout(timeout);
                if (!error) {
                    // Connection ok. 
                    resolve(response);
                } else {
                    reject(error);
                }
            });
    });
};

SagemakerEdgeAgentPT.prototype.publicConfig = function() {
    // make a copy of the current config...
    const publicConfig = JSON.parse(JSON.stringify(pt.config));

    // zero out the the auth data...
    publicConfig['config']['auth'] = {};

    // return a public viewable config
    return publicConfig;
}

SagemakerEdgeAgentPT.prototype.createJsonRpcParams = function(ptDeviceName,jsonrpc) {
    let params = {};
    if (jsonrpc !== undefined) {
        if (jsonrpc['config'] != undefined) {
            // its a config update
            const config_str = Buffer.from(JSON.stringify(pt.publicConfig())).toString('base64');
            params = {
                deviceId: ptDeviceName,
                objects: [{
                    objectId: SAGEMAKER_EDGE_AGENT_RPC_API_OBJECT_ID,
                    objectInstances: [{
                        objectInstanceId: 0,
                        resources: [
                            {
                                resourceId: SAGEMAKER_EDGE_AGENT_CONFIG_RESOURCE_ID,
                                operations: OPERATIONS.READ | OPERATIONS.WRITE,
                                type: 'string',
                                value: config_str
                            }
                        ]
                    }]
                }]
            };
        }
        else {
            // its an RPC API call response...
            const rpc_api_str = Buffer.from(JSON.stringify(jsonrpc)).toString('base64');
            const config_str = Buffer.from(JSON.stringify(pt.publicConfig())).toString('base64');
            const status_str = Buffer.from(JSON.stringify(pt.getCommandStatus())).toString('base64');
            params = {
                deviceId: ptDeviceName,
                objects: [{
                    objectId: SAGEMAKER_EDGE_AGENT_RPC_API_OBJECT_ID,
                    objectInstances: [{
                        objectInstanceId: 0,
                        resources: [
                            {
                                resourceId: SAGEMAKER_EDGE_AGENT_RPC_API_RESOURCE_ID,
                                operations: OPERATIONS.READ | OPERATIONS.EXECUTE,
                                type: 'string',
                                value: rpc_api_str
                            },
                            {
                                resourceId: SAGEMAKER_EDGE_AGENT_CONFIG_RESOURCE_ID,
                                operations: OPERATIONS.READ | OPERATIONS.WRITE,
                                type: 'string',
                                value: config_str
                            },
                            {
                                resourceId: SAGEMAKER_EDGE_AGENT_RPC_INVOKE_STATUS_RESOURCE_ID,
                                operations: OPERATIONS.READ,
                                type: 'string',
                                value: status_str
                            }
                        ]
                    }]
                }]
            };
        }
    }
    else {
        // empty input!  
        pt.log(LOGGING.ERROR,"WARNING: createJsonRpcParams: Empty input parameter");
    }

    return params;
}

SagemakerEdgeAgentPT.prototype.addResource = async function() {
    let self = this;
    return new Promise((resolve, reject) => {
        params = self.createJsonRpcParams(self.ptDeviceName,DEFAULT_JSON_RPC_COMMAND);
        let timeout = setTimeout(() => {
            reject('Timeout');
        }, TIMEOUT);

        self.client.send('device_register', params,
            function(error, response) {
                clearTimeout(timeout);
                if (!error) {
                    pt.log(LOGGING.DEBUG,'Created Sagemaker Edge Agent RPC API');
                    resolve(response);
                } else {
                    reject(error);
                }
            });
    });
}

SagemakerEdgeAgentPT.prototype.validateAuxDataParams = function(aux_params) {
    if (aux_params !== undefined && JSON.stringify(aux_params) !== '{}' && JSON.stringify(aux_params) !== '[]') {
        const aux_data_list = SUPPORTED_COMMANDS['aux_data'];
        for(var j = 0; j < aux_data_list.length; j++) {
            const param_list = aux_data_list[j]['params'];
            for (var i = 0; i < param_list.length; i++) {
                if (aux_params[param_list[i]] === undefined) {
                    pt.log(LOGGING.INFO,"Aux Data Parameters FAILED validation: " + JSON.stringify(aux_params));
                    return false;
                }
            }
        }

        // AuxData passed validation
        pt.log(LOGGING.DEBUG,"Aux Data Parameters validated: " + JSON.stringify(aux_params));
        return true;
    }
    // aux_params not present - OK
    pt.log(LOGGING.DEBUG,"Aux Data Params not present - OK");
    return true;
}

SagemakerEdgeAgentPT.prototype.validatedParams = function(method,params) {
    if (method !== undefined) {
        if (SUPPORTED_COMMANDS[method] !== undefined) {
            if (params !== undefined && JSON.stringify(params) !== '[]' ) {
                const param_json = SUPPORTED_COMMANDS[method];
                if (param_json !== undefined && JSON.stringify(param_json) !== '{}') {
                    const param_list = param_json['params'];
                    if (param_list !== undefined && JSON.stringify(param_list) != '[]') {
                        // find key matches for each required parameter. Extraneous params will be ignored. 
                        for (var i = 0; i < param_list.length; i++) {
                            if (params[param_list[i]] === undefined) {
                                // missing a required parameter
                                pt.log(LOGGING.ERROR,"Invalid Parameters: Missing required parameter: " + param_list[i])
                                return false;
                            }
                        }

                        // if we make it this far, we are good
                        pt.log(LOGGING.DEBUG,"Parameters validated: " + JSON.stringify(params) + " Method: " + method + ". Checking for AuxData...");
                        return pt.validateAuxDataParams(params['aux_data']);   
                    }
                }
                // any misses here will fall through to the end resulting in invalidation...
            }
            else {
                // no parameters specified (OK)
                pt.log(LOGGING.DEBUG,"No parameters specified (OK). Validated OK.");
                return true;
            }
        }
    }
    pt.log(LOGGING.ERROR,"Invalid Parameters: " + method + " Params: " + JSON.stringify(params));
    return false;
}

SagemakerEdgeAgentPT.prototype.isSupportedMethod = function(method,params) {
    if (method !== undefined) {
        if (SUPPORTED_COMMANDS[method] !== undefined) {
            if (params !== undefined && JSON.stringify(params) !== '[]' ) {
                return this.validatedParams(method,params);
            }
            pt.log(LOGGING.DEBUG,"Supported Method: " + method + " (no params)")
            return true;
        }
    }
    pt.log(LOGGING.ERROR,"Unsupported Method: " + method + " Params: " + params);
    return false;
}

SagemakerEdgeAgentPT.prototype.validateCommand = function(jsonrpc) {
    if (jsonrpc !== undefined && JSON.stringify(jsonrpc) !== "{}" &&
        jsonrpc['jsonrpc'] === '2.0' && this.isSupportedMethod(jsonrpc['method'],jsonrpc['params']) &&
        jsonrpc['id'] !== undefined) {
            pt.log(LOGGING.INFO,"Command Validated: " + JSON.stringify(jsonrpc))
            return true;
    }
    pt.log(LOGGING.ERROR,"Command NOT Validated: " + JSON.stringify(jsonrpc));
    return false;
}

SagemakerEdgeAgentPT.prototype.createErrorReply = async function(jsonrpc,message,details) {
    let reply = {};
    reply['jsonrpc'] = "2.0";
    reply['id'] = jsonrpc['id'];
    reply['status'] = 'error';
    reply['reply'] = message;
    reply['details'] = details;
    return reply; 
}

SagemakerEdgeAgentPT.prototype.sendResponse = async function(result) {
    if (result !== undefined) {
        // format 
        let res = {'error':result.error,'reply':result.status,'response':result.reply};
        if (result['details'] !== undefined) {
            res['details'] = result['details'];
        }
        pt.log(LOGGING.DEBUG,"sendResponse: Response: " + JSON.stringify(res));

        // Update the resource value with the result
        pt.updateResourceValue(res);
    }
}

SagemakerEdgeAgentPT.prototype.awsModelToJsonModel = function(awsModel) {
    if (awsModel !== undefined) {
        const m = awsModel;
        let model = {};
        model['name'] = m.getName();
        model['url'] = m.getUrl();
        const input_tmdas = m.getInputTensorMetadatasList();
        const output_tmdas = m.getOutputTensorMetadatasList();
        model['input_tensor_metadatas'] = [];
        model['output_tensor_metadatas'] = [];
        for (let j=0;input_tmdas !== undefined && j<input_tmdas.length;++j) {
            const tmd = {};
            tmd['name'] = input_tmdas[j].getName();
            tmd['shape'] = input_tmdas[j].getShapeList();
            tmd['type'] = input_tmdas[j].getDataType();
            model['input_tensor_metadatas'].push(tmd);
        }
        for (let j=0;output_tmdas !== undefined && j<output_tmdas.length;++j) {
            const tmd = {};
            tmd['name'] = output_tmdas[j].getName();
            tmd['shape'] = output_tmdas[j].getShapeList();
            tmd['type'] = output_tmdas[j].getDataType();
            model['output_tensor_metadatas'].push(tmd);
        }
        return model;
    }
    return {};
}

SagemakerEdgeAgentPT.prototype.awsDataCaptureStatusToJsonDataCaptureStatus = function(awsDataCaptureStatus) {
    if (awsDataCaptureStatus !== undefined) {
        if (CaptureDataStatus == proto.AWS.SageMaker.Edge.CaptureDataStatus.FAILURE) {
            return "FAILURE";
        }
        if (CaptureDataStatus == proto.AWS.SageMaker.Edge.CaptureDataStatus.SUCCESS) {
            return "SUCCESS";
        }
        if (CaptureDataStatus == proto.AWS.SageMaker.Edge.CaptureDataStatus.IN_PROGRESS) {
            return "IN_PROGRESS";
        }
    }
    return "NOT_FOUND";
}

SagemakerEdgeAgentPT.prototype.listModels = async function(jsonrpc) {
    pt.log(LOGGING.DEBUG,"Calling listModels...");
    const request = new sagemakerAgentMessages.ListModelsRequest();
    this.sage_client.listModels(request,function(err,res) {
        let reply = {};
        reply['jsonrpc'] = "2.0";
        reply['id'] = jsonrpc['id'];
        if (err) {
            // gRPC command failed
            pt.log(LOGGING.ERROR,"ListModels FAILED: " + err);
            reply['status'] = 'error';
            reply['error'] = err.code;
            reply['reply'] = err.message;
        }
        else {
            pt.log(LOGGING.ERROR,"ListModels SUCCESS: " + res);
            reply['status'] = 'ok';
            reply['error'] = 'none';

            // Parse the Models List
            reply['reply'] = [];
            if (res !== undefined) {
                const ma = res.getModelsList();
                if (ma !== undefined && ma.length > 0) {
                    for (let i=0;i<ma.length; ++i ) {
                        const model = pt.awsModelToJsonModel(ma[i]);
                        pt.log(LOGGING.INFO, "listModels(" + i + "): Model: " + JSON.stringify(model) + " loaded!");
                        reply['reply'].push(model);
                    }
                }
                else {
                    pt.log(LOGGING.INFO, "listModels(): AWS getModelList() return empty list (OK). No models loaded.");
                }
            }
            else {
                pt.log(LOGGING.ERROR, "listModels(): AWS response was NULL. Unable to list models");
            } 
        }

        // send our response
        if (reply['status'] === 'error') {
            pt.log(LOGGING.ERROR,"listModels(): ERROR Response: " + res + " Error: " + err + " reply: " + JSON.stringify(reply));
            pt.setCommandStatus("listModels",CMD_STATUS.ERROR);
        }
        else {
            pt.log(LOGGING.INFO,"listModels(): Response: " + res + " Error: " + err + " reply: " + JSON.stringify(reply));
            pt.setCommandStatus("listModels",CMD_STATUS.IDLE);
        }
        pt.sendResponse(reply)
    });
}

SagemakerEdgeAgentPT.prototype.readFileFromS3Bucket = async function(s3, params) {
    return new Promise((resolve, reject) => {
        s3.getObject(params, function (err, s3_data) {
            if (err) {
                reject(err);
            } else {
                pt.log(LOGGING.INFO,"readFileFromS3Bucket: Read SUCCESS: File: " + params['Key'] + " Bytes read: " + s3_data['Body'].byteLength);
                resolve(s3_data);
            }
        });
    });
}

SagemakerEdgeAgentPT.prototype.copyModelFromS3 = async function(jsonrpc) {
    const status = {};
    status['status'] = 'error';
    const bucket = "";

    return new Promise(async (resolve, reject) => {
        // if our model already exists locally... move it...
        const model_dir = LOCAL_DIR + "/" + jsonrpc['params']['name'];
        try {
            if (fs.existsSync(model_dir)) {
                const renamed_model_dir = model_dir + "-" + Date.now();
                pt.log(LOGGING.DEBUG,"copyModelFromS3: model already exists... relocating to: " + renamed_model_dir);
                fs.renameSync(model_dir, renamed_model_dir);
            }
        } catch(ex) {
                pt.log(LOGGING.ERROR,"copyModelFromS3: ERROR in checking model existance/relocation", ex)
        }

        // We must have previously configured our PT with appropriate config details apriori...
        if (pt.config['config']['auth']['awsAccessKeyId'] !== "" && pt.config['config']['auth']['awsSecretAccessKey'] !== "") {
            // construct our filename to our model we want to download...
            const filename = pt.config['config']['awsS3ModelsDirectory'] + "/" + jsonrpc['params']['s3_filename']; 

            // set the region for AWS S3 support
            AWS.config.update({region: this.config['config']['awsRegion']});

            // use the AWS S3 API to pull the contents of the file in the S3 bucket
            const s3 = new AWS.S3(
                        {
                            accessKeyId: pt.config['config']['auth']['awsAccessKeyId'], 
                            secretAccessKey: pt.config['config']['auth']['awsSecretAccessKey'], 
                            Bucket:pt.config['config']['awsS3Bucket']
                        });

            // Pull the model from the S3 bucket
            pt.log(LOGGING.INFO,"Pulling Model from S3... Bucket: " + pt.config['config']['awsS3Bucket'] + " File: " + filename);

            // read the file content from the S3 bucket 
            const params = {'Bucket':pt.config['config']['awsS3Bucket'], 'Key':filename};
            const data = await pt.readFileFromS3Bucket(s3,params);
            if (data !== undefined && JSON.stringify(data) !== '{}') {
                // Now save the file locally...
                const local_fq_filename = LOCAL_DIR + "/" + jsonrpc['params']['s3_filename'];
                pt.log(LOGGING.INFO,"copyModelFromS3: Read in " + data.Body.byteLength + " bytes. Saving model file to: " + local_fq_filename);

                // make a directory for our model contents...
                let cmd = "mkdir -p " + model_dir;
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        status['error'] = "Error making directory: " + model_dir + " Error: " + error.message;
                        status['bucket'] = pt.config['config']['awsS3Bucket'];
                        status['cmd'] = cmd;
                        pt.log(LOGGING.ERROR,"copyModelFromS3 ERROR: " + status['error']);
                        resolve(status);
                    }
                    if (stderr) {
                        status['error'] = "Error in making directory: " + model_dir + " STDERR: " + stderr;
                        status['bucket'] = pt.config['config']['awsS3Bucket'];
                        status['cmd'] = cmd;
                        pt.log(LOGGING.ERROR,"copyModelFromS3 ERROR: " + status['error']);
                        resolve(status);
                    }

                    // write the file out
                    pt.log(LOGGING.DEBUG,"Saving S3 Data to: " + local_fq_filename);
                    fs.writeFileSync(local_fq_filename, data.Body);

                    // If OK, Expand the file
                    let cmd = "cd " + model_dir + "; tar xzpf " + local_fq_filename + "; rm -f " + local_fq_filename;
                    exec(cmd, (error, stdout, stderr) => {
                        if (error) {
                            status['error'] = "Error in expanding model file: " + local_fq_filename + " Error: " + error.message;
                            status['bucket'] = pt.config['config']['awsS3Bucket'];
                            status['cmd'] = cmd;
                            pt.log(LOGGING.ERROR,"copyModelFromS3 ERROR: " + status['error']);
                            resolve(status);
                        }
                        if (stderr) {
                            status['error'] = "Error in expanding model file (stderr): " + local_fq_filename + " STDERR: " + stderr;
                            status['bucket'] = pt.config['config']['awsS3Bucket'];
                            status['cmd'] = cmd;
                            pt.log(LOGGING.E,"copyModelFromS3 ERROR: " + status['error']);
                            resolve(status);
                        }

                        // note that we are done!
                        pt.log(LOGGING.DEBUG,"copyModelFromS3: Completed expansion of model file: " + local_fq_filename);
                        status['status'] = 'ok';
                        resolve(status);
                    });
                });  
            }
            else {
                // ERROR in reading file from S3
                status['error'] = "Error in reading model file from S3: " + filename;
                status['bucket'] = pt.config['config']['awsS3Bucket'];
                pt.log(LOGGING.ERROR,"copyModelFromS3 ERROR: " + status['error']);
                resolve(status);
            }
        }
        else {
            // No AWS/S3 configuration found
            status['error'] = "Unable to pull model from bucket. AWS/S3 unconfigured";
            status['bucket'] = pt.config['config']['awsS3Bucket'];
            pt.log(LOGGING.ERROR,"copyModelFromS3 ERROR: " + status['error']);
            resolve(status);
        }
    });
}

SagemakerEdgeAgentPT.prototype.reloadModel = async function(jsonrpc) {
    // build the initial reply
    let reply = {};
    reply['jsonrpc'] = "2.0";
    reply['id'] = jsonrpc['id'];

    this.setCommandStatus('unloadModel',CMD_STATUS.RUNNING);
    await pt.unloadModel(jsonrpc);
    this.setCommandStatus('unloadModel',CMD_STATUS.IDLE);
    this.setCommandStatus('loadModel',CMD_STATUS.RUNNING);
    await pt.loadModel(jsonrpc);
    pt.setCommandStatus('reloadModel',CMD_STATUS.IDLE);
    reply['status'] = 'ok';
    reply['error'] = 'none';
    reply['reply'] = 'succeeded';
    pt.log(LOGGING.INFO,"reloadModel SUCCESS: Reply: " + JSON.stringify(reply));
    pt.setCommandStatus("reloadModel",CMD_STATUS.IDLE);
    pt.sendResponse(reply);
}

SagemakerEdgeAgentPT.prototype.loadModel = async function(jsonrpc) {
    // build the initial reply
    let reply = {};
    reply['jsonrpc'] = "2.0";
    reply['id'] = jsonrpc['id'];

    // pull the model from S3... 
    const pull_status = await pt.copyModelFromS3(jsonrpc);

    // if the pull from S3 succeeded, call loadModel()...
    if (pull_status['status'] === 'ok') {
        pt.log(LOGGING.INFO,"loadModel: Model pull from S3 SUCCESS.");
        const request = new sagemakerAgentMessages.LoadModelRequest();
        const url = pt.localModelDestinationURL() + "/" + jsonrpc['params']['name'];
        request.setName(jsonrpc['params']['name']);
        request.setUrl(url); 
        pt.log(LOGGING.INFO,"Loading model: " + jsonrpc['params']['name'] + " URL: " + url);
        this.sage_client.loadModel(request,function(err,res) {
            if (err) {
                // gRPC command failed
                reply['status'] = 'error';
                reply['error'] = JSON.stringify(err);
                reply['reply'] = "";
                pt.log(LOGGING.ERROR,"loadModel FAILED: Error: " + err + " reply: " + JSON.stringify(reply));
                pt.setCommandStatus("loadModel",CMD_STATUS.IDLE);
                pt.sendResponse(reply);
            }
            else {
                reply['status'] = 'ok';
                reply['error'] = 'none';
                reply['reply'] = 'succeeded';
                pt.log(LOGGING.INFO,"loadModel SUCCESS: Reply: " + JSON.stringify(reply));
                pt.setCommandStatus("loadModel",CMD_STATUS.IDLE);
                pt.sendResponse(reply);
            }  
        });
    }
    else {
        // Unable to pull model from S3
        reply['status'] = pull_status['status'];
        reply['error'] = pull_status['error'];
        reply['reply'] = {"s3_bucket": pull_status['bucket']};
        pt.log(LOGGING.INFO,"loadModel: Model pull from S3 FAILED: " + pull_status['error']);
        pt.setCommandStatus("loadModel",CMD_STATUS.ERROR);
        pt.sendResponse(reply);
    }
}

SagemakerEdgeAgentPT.prototype.describeModel = async function(jsonrpc) {
    pt.log(LOGGING.DEBUG,"Calling describeModel...");
    const request = new sagemakerAgentMessages.DescribeModelRequest();
    request.setName(jsonrpc['params']['name']);
    this.sage_client.describeModel(request,function(err,res) {
        let reply = {};
        reply['jsonrpc'] = "2.0";
        reply['id'] = jsonrpc['id'];
        if (err) {
            // gRPC command failed
            reply['status'] = 'error';
            reply['error'] = JSON.stringify(err);
            reply['reply'] = "";
        }
        else {
            reply['status'] = 'ok';
            reply['error'] = 'none';
            reply['reply'] = 'succeeded';
        }  

        // send the reply
        if (reply['status'] === 'error') {
            pt.log(LOGGING.ERROR,"describeModel(): ERROR: " + err + " reply: " + JSON.stringify(reply));
            pt.setCommandStatus("describeModel",CMD_STATUS.IDLE);
        }
        else {
            pt.log(LOGGING.INFO,"describeModel():  Response: " + res + " reply: " + JSON.stringify(reply));
            reply['reply'] = pt.awsModelToJsonModel(res.model());
            pt.setCommandStatus("describeModel",CMD_STATUS.IDLE);
        }
        pt.sendResponse(reply);
    });
}

SagemakerEdgeAgentPT.prototype.getDataCaptureStatus = async function(jsonrpc) {
    t.log(LOGGING.DEBUG,"Calling getDataCaptureStatus...");
    const request = new sagemakerAgentMessages.GetCaptureDataStatusRequest();
    request.setCaptureId(jsonrpc['params']['capture_id']);
    this.sage_client.getDataCaptureStatus(request,function(err,res) {
        let reply = {};
        reply['jsonrpc'] = "2.0";
        reply['id'] = jsonrpc['id'];
        if (err) {
            // gRPC command failed
            reply['status'] = 'error';
            reply['error'] = JSON.stringify(err);
            reply['reply'] = "";
        }
        else {
            reply['status'] = 'ok';
            reply['error'] = 'none';
            reply['reply'] = 'succeeded';
        }  

        // send the reply
        if (reply['status'] === 'error') {
            pt.log(LOGGING.ERROR,"getDataCaptureStatus(): ERROR: " + err + " reply: " + JSON.stringify(reply));
            pt.setCommandStatus("getDataCaptureStatus",CMD_STATUS.IDLE);
        }
        else {
            pt.log(LOGGING.INFO,"getDataCaptureStatus():  Response: " + res + " reply: " + JSON.stringify(reply));
            reply['reply'] = pt.awsDataCaptureStatusToJsonDataCaptureStatus(res.getCaptureId());
            pt.setCommandStatus("getDataCaptureStatus",CMD_STATUS.IDLE);
        }
        pt.sendResponse(reply);
    });
}

SagemakerEdgeAgentPT.prototype.unloadModel = async function(jsonrpc) {
    pt.log(LOGGING.DEBUG,"Calling unloadModel...");
    const request = new sagemakerAgentMessages.UnLoadModelRequest();
    request.setName(jsonrpc['params']['name']);
    this.sage_client.unLoadModel(request,function(err,res) {
        let reply = {};
        reply['jsonrpc'] = "2.0";
        reply['id'] = jsonrpc['id'];
        if (err) {
            // gRPC command failed
            reply['status'] = 'error';
            reply['error'] = JSON.stringify(err);
            reply['reply'] = "";
        }
        else {
            reply['status'] = 'ok';
            reply['error'] = 'none';
            reply['reply'] = 'succeeded';
        }  

        // send the reply
        if (reply['status'] === 'error') {
            pt.log(LOGGING.ERROR,"unloadModel(): ERROR: " + err + " reply: " + JSON.stringify(reply));
            pt.setCommandStatus("unloadModel",CMD_STATUS.IDLE);
        }
        else {
            pt.log(LOGGING.INFO,"unloadModel():  Response: " + res + " reply: " + JSON.stringify(reply));
            pt.setCommandStatus("unloadModel",CMD_STATUS.IDLE);
        }
        pt.sendResponse(reply);
    });
}

SagemakerEdgeAgentPT.prototype.getModelByName = function(model_list, model_name) {
    // search through the model list and find the requested name 
    for(let i=0;model_list !== undefined && i < model_list.length; ++i) {
        if (model_list[i]['name'] === model_name) {
            return model_list[i];
        }
    }
}

SagemakerEdgeAgentPT.prototype.toArrayBuffer = function(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}

SagemakerEdgeAgentPT.prototype.readInputData = async function(params) {
    // parse the params and get the URL
    const url = params['input_data_url'];

    // we support local file and S3 bucket data pulls
    const fileURL = new urlParser.URL(url);
    pt.log(LOGGING.DEBUG,"Requested Data Protocol: " + fileURL.protocol);
    if (fileURL.protocol === 'file:') {
        try {
            // simply open the file and read the contents
            const filename = DATA_FILE_DIR + fileURL.pathname;
            pt.log(LOGGING.INFO,"Opening Data File (filesystem): " + filename);
            const data = await fs.readFileSync(filename);

            // return the read in bytes
            pt.log(LOGGING.INFO,"readInputData: Read in " + data.byteLength + " bytes (Buffer).");
            return data;
        }
        catch(ex) {
            // Exception thrown during file read
            pt.log(LOGGING.ERROR,"Exception: " + ex + " during File Read: " + url);
        }
    }
    else if (fileURL.protocol === 's3:') {
        // We must have previously configured our PT with appropriate config details apriori...
        if (pt.config['config']['auth']['awsAccessKeyId'] !== "" && pt.config['config']['auth']['awsSecretAccessKey'] !== "") {
            // construct the full filename within the S3 bucket (DATA)
            const filename = pt.config['config']['awsS3DataDirectory'] + fileURL.pathname;

            // set the region for AWS S3 support
            AWS.config.update({region: this.config['config']['awsRegion']});

            // use the AWS S3 API to pull the contents of the file in the S3 bucket
            const s3 = new AWS.S3(
                        {
                            accessKeyId: pt.config['config']['auth']['awsAccessKeyId'], 
                            secretAccessKey: pt.config['config']['auth']['awsSecretAccessKey'], 
                            Bucket:pt.config['config']['awsS3Bucket']
                        });

            // read the file content from the S3 bucket 
            const params = {'Bucket':pt.config['config']['awsS3Bucket'], 'Key':filename};
            pt.log(LOGGING.DEBUG,"Reading Input Data from S3 bucket: " + JSON.stringify(params));
            const data = await pt.readFileFromS3Bucket(s3, params);
            if (data !== undefined && data['Body'] !== undefined) {
                // simply return the Buffer
                pt.log(LOGGING.INFO,"S3: Read in " + data['Body'].byteLength + " bytes as Buffer.");
                return data['Body'];
            }
            else {
                // unrecognized/unsupported protocol
                pt.log(LOGGING.ERROR,"ERROR: Reading Input data from S3 bucket: " + JSON.stringify(params));
            }
        }
        else {
            // unable to read from the S3 bucket as no credentials were provided
            pt.log(LOGGING.ERROR,"ERROR: No AWS S3 credentials were provided. Unable to read from S3: " + url);
        }
    }
    else {
        // unrecognized/unsupported protocol
        pt.log(LOGGING.ERROR,"ERROR: Unrecogonized/Unsupported protocol in file data URL: " + url);
    }
    return [];
}

SagemakerEdgeAgentPT.prototype.emptyFilenameCache = function() {
    pt.filename_cache = [];
}

SagemakerEdgeAgentPT.prototype.cacheFilename = function(type, filename) {
    pt.filename_cache.push({"url": type + "://" + filename});
}

SagemakerEdgeAgentPT.prototype.getCachedFilenames = function() {
    return {'output': pt.filename_cache};
}

SagemakerEdgeAgentPT.prototype.writeToLocalFile = async function(url,name,data) {
    // create the output filename
    const path_elements = url.pathname.split(".");
    const filename = LOCAL_DIR + path_elements[0] + "-" + name + "-" + Date.now() + "." + path_elements[1];

    // cache the filename
    pt.cacheFilename('file',filename);

    // write the data to the file
    pt.log(LOGGING.INFO,"Writing prediction results to local file: " + filename);
    await fs.writeFileSync(filename, Buffer.from(data));
}

SagemakerEdgeAgentPT.prototype.writeToS3Bucket = async function(url,name,data) {
    // create the output filename
    const path_elements = url.pathname.split(".");
    const out_filename = path_elements[0] + "-" + name + "-" + Date.now() + "." + path_elements[1];

    // We must have previously configured our PT with appropriate config details apriori...
    if (pt.config['config']['auth']['awsAccessKeyId'] !== "" && pt.config['config']['auth']['awsSecretAccessKey'] !== "") {
        // construct the full filename within the S3 bucket (DATA)
        const filename = pt.config['config']['awsS3DataDirectory'] + out_filename;

        // add this to the output filenames
        pt.cacheFilename('s3',filename);

        // set the region for AWS S3 support
        AWS.config.update({region: this.config['config']['awsRegion']});

        // use the AWS S3 API to write the contents of the file to the S3 bucket
        const s3 = new AWS.S3(
                    {
                        accessKeyId: pt.config['config']['auth']['awsAccessKeyId'], 
                        secretAccessKey: pt.config['config']['auth']['awsSecretAccessKey'], 
                        Bucket:pt.config['config']['awsS3Bucket']
                    });

        // params to write the file to the S3 bucket 
        const params = {
                        'Bucket':pt.config['config']['awsS3Bucket'], 
                        'Key':filename,
                        'Body':Buffer.from(data)
                       };

        // write the file to the S3 bucket
        pt.log(LOGGING.INFO,"Writing prediction results S3 bucket: " + pt.config['config']['awsS3Bucket'] + " File: " + filename);
        return await new Promise((resolve, reject) => {
            s3.upload(params, function(err, data) {
                if (err) {
                    pt.log(LOGGING.ERROR,"writeToS3Bucket: ERROR Uploading " + filename + " to S3: " + err);
                    reject(err);
                }
                else {
                    pt.log(LOGGING.INFO,`writeToS3Bucket: File uploaded successfully. ${data.Location}`);
                    resolve(filename);
                }
            });
        });
    }
    else {
        // no credentials...
        pt.log(LOGGING.ERROR,"Error writing file to S3 bucket: credentials not initialized. URL: " + url);
        return "error";
    }
}

SagemakerEdgeAgentPT.prototype.createJsonTensor = function(name,shape,type,b64_byte_data) {
    const json_tensor = {};
    json_tensor['name'] = name;              // string
    json_tensor['type'] = type;              // int
    json_tensor['shape'] = shape;            // [] of ints...
    json_tensor['b64_data'] = b64_byte_data; // Base64 encoded data
    return JSON.stringify(json_tensor);
}

SagemakerEdgeAgentPT.prototype.savePredictedResponseToFile = function(output_url, res) {
    // parse the output url...
    const outURL = new urlParser.URL(output_url);

    // reset our filename cache
    pt.emptyFilenameCache();

    // get the Tensor Metadata and look for byte data...
    const tensor_list = res.getTensorsList();
    pt.log(LOGGING.INFO,"savePredictedResponseToFile(): Found " + tensor_list.length + " output tensors in predict() result");
    for(let i=0;tensor_list !== undefined && i < tensor_list.length;++i) {
        const tensor = tensor_list[i];
        const tensor_metadata = tensor.getTensorMetadata(); 
        const tensor_name = tensor_metadata.getName();
        const tensor_type = tensor_metadata.getDataType();
        const tensor_shape = tensor_metadata.getShapeList();
        const tensor_b64_byte_data = tensor.getByteData_asB64();
        const json_tensor_str = pt.createJsonTensor(tensor_name,tensor_shape,tensor_type,tensor_b64_byte_data);

        // Report the output tensor
        pt.log(LOGGING.INFO,"savePredictedResponseToFile(): OutputTensor[" + (i+1) + "] - Name: " + tensor_name + " Type: " + tensor_type +
                                                " Shape: " + JSON.stringify(tensor_shape) + 
                                                " ByteDataLength: " + tensor_b64_byte_data.length);
        pt.log(LOGGING.DEBUG,"savePredictedResponseToFile(): " + 
                                                " Data(0..." + pt.debug_tensor_count + "): " + tensor_b64_byte_data.substring(0, pt.debug_tensor_count) +
                                                " Data(" + (tensor_b64_byte_data.length-pt.debug_tensor_count) + "..." + tensor_b64_byte_data.length + "): " + 
                                                tensor_b64_byte_data.substring((tensor_b64_byte_data.length-pt.debug_tensor_count), tensor_b64_byte_data.length));

        // Save to specified file/location
        if (outURL.protocol === "file:") {
            // write to local file
            pt.writeToLocalFile(outURL,tensor_name,json_tensor_str);
        }
        else if (outURL.protocol === "s3:") {
            // write to S3 bucket
            pt.writeToS3Bucket(outURL,tensor_name,json_tensor_str);
        }
    }
    return "no data";
}

SagemakerEdgeAgentPT.prototype.base64ToArrayBuffer = function(b64_str) {
    var bin_str = atob(b64_str);
    var len = bin_str.length;
    var bytes_array = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes_array[i] = bin_str.charCodeAt(i);
    }
    return bytes_array.buffer;
}

SagemakerEdgeAgentPT.prototype.toAWSEncoding = function(str_encoding) {
    if (str_encoding === "CSV") {
        return proto.AWS.SageMaker.Edge.Encoding.CSV;
    }
    if (str_encoding === "JSON") {
        return proto.AWS.SageMaker.Edge.Encoding.JSON;
    }
    if (str_encoding === "BASE64") {
        return proto.AWS.SageMaker.Edge.Encoding.BASE64;
    }
    return proto.AWS.SageMaker.Edge.Encoding.NONE;
}

SagemakerEdgeAgentPT.prototype.predict = async function(jsonrpc) {
    let error_message = "ok";
    let capture_enable = false;

    const reply = {};
    reply['jsonrpc'] = "2.0";
    reply['id'] = jsonrpc['id'];
    reply['status'] = 'ok';
    reply['error'] = "";
    reply['reply'] = "";

    // First lets get our input data (which will be in an Buffer...)
    let input_data = await pt.readInputData(jsonrpc['params']);
    if (input_data === undefined || input_data.length == 0) {
        pt.log(LOGGING.ERROR,'Unable to read input data for prediction.');
        error_message = 'Unable to read input data for prediction.';

        // reply with an error message
        reply['status'] = 'error';
        reply['error'] = error_message;
        pt.setCommandStatus("predict",CMD_STATUS.ERROR);
        pt.sendResponse(reply);
    }
    else {
        // Next we have to get our model detail
        const request = new sagemakerAgentMessages.ListModelsRequest();
        pt.log(LOGGING.DEBUG,"Calling listModels()...");
        this.sage_client.listModels(request, function(err,res) {
            if (err) {
                // gRPC command failed
                error_message = "predict(): ERROR: listModels() gRPC call failed. Unable to predict(): " + err;
                reply['status'] = 'error';
                reply['error'] = JSON.stringify(err);
                reply['reply'] = error_message;
                pt.log(LOGGING.ERROR,error_message);
                pt.setCommandStatus("predict",CMD_STATUS.ERROR);
                pt.sendResponse(reply);
            }
            else {
                // succeeded
                pt.log(LOGGING.DEBUG,"Got the Models List...");
                const model_list = [];
                if (res !== undefined) {
                    const ma = res.getModelsList();
                    if (ma !== undefined && ma.length > 0) {
                        for (let i=0;i<ma.length; ++i ) {
                            const m = ma[i];
                            let model = {};
                            model['name'] = m.getName();
                            model['url'] = m.getUrl();
                            const input_tmdas = ma[i].getInputTensorMetadatasList();
                            const output_tmdas = ma[i].getOutputTensorMetadatasList();
                            model['input_tensor_metadatas'] = [];
                            model['output_tensor_metadatas'] = [];
                            for (let j=0;input_tmdas !== undefined && j<input_tmdas.length;++j) {
                                const tmd = {};
                                tmd['name'] = input_tmdas[j].getName();
                                tmd['shape'] = input_tmdas[j].getShapeList();
                                tmd['type'] = input_tmdas[j].getDataType();
                                model['input_tensor_metadatas'].push(tmd);
                            }
                            for (let j=0;output_tmdas !== undefined && j<output_tmdas.length;++j) {
                                const tmd = {};
                                tmd['name'] = output_tmdas[j].getName();
                                tmd['shape'] = output_tmdas[j].getShapeList();
                                tmd['type'] = output_tmdas[j].getDataType();
                                model['output_tensor_metadatas'].push(tmd);
                            }
                            model_list.push(model);
                        }
                    }
                }
                
                // continue if we have a model list...
                if (model_list !== undefined && model_list.length > 0) {
                    // get our selected model
                    const selected_model = pt.getModelByName(model_list,jsonrpc['params']['model_name']);
                    if (selected_model !== undefined) {
                        // convert the model's Tensor list...
                        const grpc_tensor_list = [];
                        const input_tmdas = selected_model['input_tensor_metadatas'];
                        for(let i=0;input_tmdas !== undefined && i < input_tmdas.length;++i) {
                            const tensor = new sagemakerAgentMessages.Tensor();
                            const tensor_metadata = new sagemakerAgentMessages.TensorMetadata();
                            tensor_metadata.setName(input_tmdas[i]['name']);
                            tensor_metadata.setDataType(input_tmdas[i]['type']);
                            tensor_metadata.setShapeList(input_tmdas[i]['shape']);
                            tensor.setTensorMetadata(tensor_metadata);
                            tensor.clearByteData();
                            input_data_json = JSON.parse(input_data);
                            tensor.setByteData(pt.base64ToArrayBuffer(input_data_json['b64_data']));

                            // DEBUG
                            pt.log(LOGGING.DEBUG,"predict(): Input Tensor Name: " + tensor_metadata.getName());
                            pt.log(LOGGING.DEBUG,"predict(): Input Tensor Type: " + tensor_metadata.getDataType());
                            pt.log(LOGGING.DEBUG,"predict(): Input Tensor Shape: " + tensor_metadata.getShapeList());

                            // add the input tensor
                            grpc_tensor_list.push(tensor);
                        }

                        // configure the prediction request...
                        pt.log(LOGGING.DEBUG,"Creating the predict() Request...");
                        const request = new sagemakerAgentMessages.PredictRequest();
                        request.setName(selected_model['name']);
                        request.setTensorsList(grpc_tensor_list);

                        // if enabled, construct the capture request
                        const capture_request = new sagemakerAgentMessages.CaptureDataRequest();
                        capture_enable = (jsonrpc['params']['capture_enable'] !== undefined && jsonrpc['params']['capture_enable'] === true);
                        if (capture_enable === true) {
                            // capture is enabled
                            pt.log(LOGGING.INFO,"Capture ENABLED. Configuring CaptureData Request...")

                            // prepare the CaptureData request...
                            capture_request.setModelName(selected_model['name']);
                            capture_request.setCaptureId(jsonrpc['id']);
                            capture_request.setInputTensorsList(grpc_tensor_list);

                            // initially clear these out.
                            capture_request.clearOutputTensorsList();
                            capture_request.clearInferenceTimestamp();
                            capture_request.clearInputsList();

                            // TO DO:  when do we set this?  setInferenceTimestamp()...

                            // AuxData list
                            aux_data_list = jsonrpc['params']['aux_data'];
                            if (aux_data_list !== undefined && JSON.stringify(aux_data_list) !== '{}' && JSON.stringify(aux_data_list) !== '[]') {
                                let aws_aux_data_list = [];
                                for(var i = 0; i < aux_data_list.length; i++) {
                                    const aux_data = aux_data_list[i];
                                    const aws_aux_data = new sagemakerAgentMessages.AuxilaryData();
                                    aws_aux_data.setName(aux_data['name']);
                                    aws_aux_data.setEncoding(pt.toAWSEncoding(aux_data['encoding']));
                                    aws_aux_data.clearByteData();
                                    aws_aux_data.setByteData(pt.base64ToArrayBuffer(aux_data['b64_data']));
                                    aws_aux_data_list.push(aws_aux_data);
                                }
                                capture_request.setInputsList(aws_aux_data_list);
                            }
                        }
                        else {
                            // capture is disabled
                            pt.log(LOGGING.DEBUG,"Capture DISABLED (OK).")
                        }

                        // call prediction and get the result...
                        pt.log(LOGGING.INFO,"Calling predict() with the input data and model: " + selected_model['name']);
                        pt.sage_client.predict(request, async function(err,res) {
                            // check for the error condition
                            if (err) {
                                // gRPC command failed
                                reply['status'] = 'error';
                                reply['error'] = JSON.stringify(err);
                                reply['reply'] = "predict() failed";
                                pt.log(LOGGING.ERROR,"predict(): FAILED with ERROR: " + err);
                                pt.setCommandStatus("predict",CMD_STATUS.ERROR);
                                pt.sendResponse(reply);
                            }
                            else {
                                // if we have a request to write the response to a specific file... we do that here
                                if (jsonrpc['params']['output_url'] !== undefined) {
                                    // OK
                                    reply['status'] = 'ok';
                                    reply['error'] = 'none';
                                    reply['reply'] = 'successful';

                                    // save the response to a specified file
                                    pt.log(LOGGING.DEBUG,"predict() completed. Results to be saved: " + jsonrpc['params']['output_url']);
                                    pt.savePredictedResponseToFile(jsonrpc['params']['output_url'],res);
                                    reply['details'] = pt.getCachedFilenames();

                                    // if enabled, invoke CaptureData request....
                                    if (capture_enable === true) {
                                        // we requested data capture... so fill in the details here an invoke the data capture
                                        pt.log(LOGGING.INFO,"Calling captureData() with the input data and model: " + capture_request.getModelName());
                                        
                                        // fill in the capture details
                                        await capture_request.setOutputTensorsList(res.getTensorsList());

                                        // TO DO:  setInferenceTimestamp()

                                        // invoke the capture request
                                        pt.sage_client.captureData(capture_request, function(capture_err,capture_res) {
                                            if (capture_err) {
                                                // gRPC command failed (capture failed specifically...)
                                                reply['status'] = 'error';
                                                reply['error'] = JSON.stringify(err);
                                                reply['reply'] = "predict(capture) failed";
                                                pt.log(LOGGING.ERROR,"predict(capture): FAILED with ERROR: " + err);
                                                pt.setCommandStatus("predict",CMD_STATUS.ERROR);
                                                pt.sendResponse(reply);
                                            }
                                            else {
                                                // TO DO: Save off any capture replies...
                                                //reply['details'] = capture_res;

                                                // capture succeeded... so save off the capture reply (which is none...)
                                                pt.log(LOGGING.INFO,"SUCCESS. predict(capture) completed. Reply: " + JSON.stringify(reply));
                                                pt.setCommandStatus("predict",CMD_STATUS.IDLE);
                                                pt.sendResponse(reply);
                                            }
                                        });
                                    } 
                                    else {
                                        // return the response
                                        pt.log(LOGGING.INFO,"SUCCESS. predict() completed and results saved. Reply: " + JSON.stringify(reply));
                                        pt.setCommandStatus("predict",CMD_STATUS.IDLE);
                                        pt.sendResponse(reply);
                                    }
                                }
                                else {
                                    // predict() succeeded but no output URL was specified, so unable to store results...
                                    reply['status'] = 'error';
                                    reply['error'] = 'predict() successful but no output URL supplied in command. Unable to save results.';
                                    reply['reply'] = 'predict() succeeded but no unable to store results';
                                    pt.log(LOGGING.ERROR,reply['error']);
                                    pt.setCommandStatus("predict",CMD_STATUS.ERROR);
                                    pt.sendResponse(reply);
                                }  
                            }
                        });    
                    }
                    else {
                        // requested model not loaded
                        error_message = "predict ERROR: Request model: " + jsonrpc['params']['model_name'] + " not loaded. Unable to predict()...";
                    }
                }
                else if (model_list !== undefined) {
                    // no model has been loaded so unable to predict
                    error_message = "predict ERROR: Request model: " + jsonrpc['params']['model_name'] + " not loaded. Unable to predict()...";
                }
                else {
                    // error in retrieving models
                    error_message = "predict ERROR: Request model: " + jsonrpc['params']['model_name'] + " not loaded. Unable to predict()...";
                }
            }

            // reply with an error message
            if (error_message !== undefined && error_message !== 'ok') {
                if (error_message === "ok") {
                    reply['status'] = 'ok';
                    reply['error'] = 'none';
                }
                else {
                    reply['status'] = 'error';
                    reply['error'] = error_message;
                }
                reply['reply'] = "";
                pt.log(LOGGING.ERROR,error_message + " reply: " + JSON.stringify(reply));
                pt.sendResponse(reply);
            }
        });
    }
    return reply;
}

SagemakerEdgeAgentPT.prototype.configUpdatedResponse = async function(jsonrpc) {
    let reply = {};
    reply['jsonrpc'] = "2.0";
    reply['id'] = jsonrpc['id'];
    reply['status'] = 'ok';
    reply['error'] = 'none';
    reply['reply'] = 'config updated';
    pt.log(LOGGING.INFO,"configUpdatedResponse reply: " + JSON.stringify(reply));

    // send the response
    pt.sendResponse(reply)
}

SagemakerEdgeAgentPT.prototype.getCommandStatus = function() {
    return pt.commandStatus;
}

SagemakerEdgeAgentPT.prototype.setCommandStatus = function(command,status) {
    pt.commandStatus[command] = status;
    pt.log(LOGGING.INFO,"Command Status: " + JSON.stringify(pt.commandStatus));
    return pt.commandStatus;
}

SagemakerEdgeAgentPT.prototype.invokeCommand = async function(jsonrpc) {
    let result = {};
    let in_error = false;
    try {
        this.setCommandStatus(jsonrpc['method'],CMD_STATUS.RUNNING);
        switch(jsonrpc['method']) {
            case('listModels'):
                // listModels method
                this.sendResponse({'error':'none','status':'ok','reply':'request dispatched', 'details': "listModels"});
                await this.listModels(jsonrpc);
                break;
            case('loadModel'):
                // loadModel method
                this.sendResponse({'error':'none','status':'ok','reply':'request dispatched', 'details': "loadModel"});
                await this.loadModel(jsonrpc);
                break;
            case('describeModel'):
                // describeModel method
                this.sendResponse({'error':'none','status':'ok','reply':'request dispatched', 'details': "describeModel"});
                await this.describeModel(jsonrpc);
                break;
            case('reloadModel'):
                // reloadModel method
                this.sendResponse({'error':'none','status':'ok','reply':'request dispatched', 'details': "reloadModel"});
                await this.reloadModel(jsonrpc);
                break;
            case('unloadModel'):
                // unloadModel method
                this.sendResponse({'error':'none','status':'ok','reply':'request dispatched', 'details': "unloadModel"});
                await this.unloadModel(jsonrpc);
                break;
            case ('getDataCaptureStatus'):
                // getDataCaptureStatus method
                this.sendResponse({'error':'none','status':'ok','reply':'request dispatched', 'details': "getDataCaptureStatus"});
                await this.getDataCaptureStatus(jsonrpc);
                break;
            case('predict'):
                // predict method
                this.sendResponse({'error':'none','status':'ok','reply':'request dispatched', 'details': "predict"});
                await this.predict(jsonrpc);
                break;
            default:
                // unsupported method
                in_error = true;
                result = await this.createErrorReply(jsonrpc,"Unsupported Method",jsonrpc['method']);
                this.setCommandStatus(jsonrpc['method'],CMD_STATUS.ERROR);

                // send a response (typically an error response)
                this.sendResponse(result);
        }
    }
    catch(ex) {
        this.setCommandStatus(jsonrpc['method'],CMD_STATUS.ERROR);
        pt.log(LOGGING.ERROR,"Exception caught in invokeCommand", ex);
        const [, lineno, colno] = ex.stack.match(/(\d+):(\d+)/);
        pt.log(LOGGING.ERROR, 'Line:' + lineno + ' Column: ' + colno);
        result = await this.createErrorReply(jsonrpc,"EX: " + ex.message,jsonrpc['method']);

        // send a response (typically an error response)
        this.sendResponse(result);
    }
}

SagemakerEdgeAgentPT.prototype.updateConfiguration = async function(new_config) {
    // update the configuration components...
    await Object.keys(new_config).forEach(function(key) {
        pt.config['config'][key] = new_config[key];
        });
}

SagemakerEdgeAgentPT.prototype.isConfigCommand = function(jsonrpc) {
    if (jsonrpc !== undefined && jsonrpc['config'] !== undefined) {
        return true;
    }
    return false;
}

SagemakerEdgeAgentPT.prototype.processCommand = async function(jsonrpc) {
    if (this.isConfigCommand(jsonrpc)) {
        // update our configuration
        await this.updateConfiguration(jsonrpc['config']);
        
        // send a config update response
        this.configUpdatedResponse(jsonrpc);
    }
    else if (this.validateCommand(jsonrpc)) {
        // command has valid form - so execute it
        await this.invokeCommand(jsonrpc);
    }
    else {
        // invalid command type given... so respond with an error response
        const result = await this.createErrorReply(jsonrpc,"Invalid Command",jsonrpc['method']);
        
        // send a response (typically an error result)
        this.sendResponse(result);
    }
}

SagemakerEdgeAgentPT.prototype.updateResourceValue = async function(json) {
    let self = this;
    return new Promise((resolve, reject) => {

        const timeout = setTimeout(() => {
            reject('Timeout');
        }, TIMEOUT);

        const params = self.createJsonRpcParams(self.ptDeviceName,json);

        self.client.send('write', params,
            function(error, response) {
                clearTimeout(timeout);
                if (!error) {
                    resolve(response);
                } else {
                    reject(error);
                }
            });
    });
}

SagemakerEdgeAgentPT.prototype.runJsonRpcCommandProcessor = async function() {
    let result = {};
    pt.client.expose('write', async (params, response) => {
        let valueBuff = new Buffer.from(params.value, 'base64');
        let jsonrpc_str = valueBuff.toString('utf-8');
        let resourcePath = params.uri.objectId + '/' + params.uri.objectInstanceId + '/' + params.uri.resourceId;
        if (params.operation === OPERATIONS.EXECUTE || params.operation === OPERATIONS.WRITE) {
            try {
                // Execute the RPC request with Sagemaker API...
                const jsonrpc = JSON.parse(jsonrpc_str);
                pt.processCommand(jsonrpc);
                response(/* no error */ null, /* success */ 'ok');
                await pt.connect();
            } catch (ex) {
                // did not receive an execute command - so ignore
                pt.log(LOGGING.ERROR,'Exception while processing command', ex);
                result = {"error":"Exception while processing command: " + ex,"reply":"error"};

                // Update the resource value with the result
                response(result, null);
                await pt.connect();
            }
        }
        else {
            // did not receive an execute command - so ignore
            pt.log(LOGGING.INFO,'Not an execute or config update command. Ignoring request... (OK)');
            result = {"error":"Not an Execute/Config Update command","reply":"error"};

            // Update the resource value with the result
            response(result, null);
            await pt.connect();
        }
    });
}

SagemakerEdgeAgentPT.prototype.getOutputTensorFilename = function(json_obj) {
    // Output Tensor located file here: json_obj['output'][0]['url']
    if (json_obj !== undefined && json_obj['output'] !== undefined) {
        const list = json_obj['output'];
        if (list !== undefined && list.length > 0) {
            const url = list[0];
            if (url !== undefined && url['url'] !== undefined) {
                return url['url'];
            }
            else {
                pt.log(LOGGING.INFO,"getOutputTensorFilename: URL field not found: " + JSON.stringify(json_obj));
            }
        }
        else {
            pt.log(LOGGING.INFO,"getOutputTensorFilename: Zero length output list: " + JSON.stringify(json_obj));
        }
    }
    else {
        pt.log(LOGGING.INFO,"getOutputTensorFilename: Missing details and/or output fields: " + JSON.stringify(json_obj));
    }
    return "none";
}

SagemakerEdgeAgentPT.prototype.processMQTTCommand = async function(buffer) {
    // messages come in as Buffer type...
    const json_str = buffer.toString('utf8');

    // parse the string
    try {
        // parse the JSON string
        const json = JSON.parse(json_str);

        // decode the command and act
        switch(json['command']) {
            case "predict":
                // delete temp files 
                const timestamp = json['timestamp'];
                const root_dir = json['root_dir']; 
                const doRetain = json['retain'];
                const base_dir = json['base_dir'];
                const tensor_file = json['tensor_filename'];

                // prepare the predict() command
                let cmd = {};
                cmd['jsonrpc'] = "2.0";
                cmd['id'] = uuidv4();
                cmd['method'] = "predict"
                cmd['params'] = {}
                cmd['params']['model_name'] = json['model'];
                cmd['params']['input_data_url'] = "file:///" + path.basename(tensor_file);
                cmd['params']['output_url'] = "s3:///" + "prediction-" + timestamp + ".tensor";

                // XXX: manual capture until this is working properly...
                cmd['params']['capture_enable'] = false; // doRetain;

                // TODO: if doRetain == true, we might want to use the Sagemaker AuxData... ??

                // invoke predict()
                pt.log(LOGGING.INFO,"Invoking predict(): Command: " + JSON.stringify(cmd));
                await pt.predict(cmd);
                const reply = pt.getCachedFilenames();

                // predict() result
                // pt.log(LOGGING.INFO, "Predict() result: " + JSON.stringify(reply));

                // dispatch any cleanup
                cmd = {};
                cmd['command'] = "clean";
                cmd['timestamp'] = timestamp;
                cmd['retain'] = doRetain;
                cmd['root_dir'] = root_dir;
                cmd['base_dir'] = base_dir;
                cmd['tensor_filename'] = tensor_file;
                cmd['files'] = json['files'];
                cmd['output_tensor'] = pt.getOutputTensorFilename(reply);
                pt.log(LOGGING.INFO, "Sending Cleanup Command: " + JSON.stringify(cmd));
                await pt.mqttClient.publish(MQTT_COMMAND_TOPIC,JSON.stringify(cmd));
                break;
            default:
                // ignore unsupported/handled commands
                pt.log(LOGGING.DEBUG, "Command: " + json['command'] + " ignored (no processor) - OK.");
                break;
        }
    }
    catch(ex) {
        // error in processing mqtt command
        pt.log(LOGGING.ERROR, "Exception in processMQTTCommand: " + exi + ". Ignoring command.", ex);
    }
}
SagemakerEdgeAgentPT.prototype.connectToMQTTBroker = async function(mypt) {
    if (mypt.mqttConnected == false) {
        try {
            // connect to MQTT broker...
            mypt.log(LOGGING.INFO,"Connecting to internal MQTT broker: " + mypt.mqttUrl + "...");
            const client = mqtt.connect(mypt.mqttUrl, mypt.mqttOptions);
            client.on('connect', function () {
                // note that we are connected
                mypt.mqttConnected = true;
                mypt.mqttClient = client;
                mypt.log(LOGGING.INFO, "Connected to MQTT: " + mypt.mqttUrl);

                // subscribe to the command channel
                client.subscribe(MQTT_COMMAND_TOPIC, function (err) {
                    if (err) {
                        mypt.log(LOGGING.ERROR,"Error in subscribing to the command channel: " + err);
                    }
                });
            });
            client.on('disconnect', function () {
                // we are no longer connected
                mypt.mqttConnected = false;
                mypt.mqttClient = undefined;
                mypt.log(LOGGING.INFO, "Disconnnected from MQTT: " + mypt.mqttUrl);
            });
            client.on('message', async function (topic, buffer) {
                if (topic !== undefined && topic == MQTT_COMMAND_TOPIC) {
                    // process received command
                    mypt.processMQTTCommand(buffer);
                }
            });
        }
        catch(ex) {
            // unable to connect to mqtt broker
            mypt.log(LOGGING.ERROR, "Unable to connect to mqtt broker: " + ex, ex);
            mypt.mqttConnected = false;
            mypt.mqttClient = undefined;
        }
    }
};

(async function() {
    try {
        // create the Sagemaker PT using the environment configuration
        pt = new SagemakerEdgeAgentPT(process.env.SAPT_MAP_PORT,
                                      process.env.SAPT_LOG_LEVEL,
                                      process.env.SAPT_AWS_ACCESS_KEY_ID,
                                      process.env.SAPT_AWS_SECRET_ACCESS_KEY,
                                      process.env.SAPT_AWS_S3_BUCKET,
                                      process.env.SAPT_AWS_S3_MODELS_DIR,
                                      process.env.SAPT_AWS_S3_DATA_DIR,
                                      process.env.SAPT_AWS_REGION,
                                      process.env.SAPT_PT_DEVICE_NAME);

        // Set SIGINT handle
        process.on('SIGINT', sigintHandler = async function() {
            pt.log(LOGGING.INFO,"Caught SIGINT. Disconnecting and exiting...");
            process.exit(1);
        });
       
        // Connect to Edge
        await pt.connect();
        pt.log(LOGGING.INFO,'Connected to Edge');

        // Register with Edge as a PT
        let response = await pt.registerSagemakerEdgeAgentProtocolTranslator();
        pt.log(LOGGING.INFO,'Registered as Protocol Translator. Response:', response);

        // Add the Sagemaker Json RPC Resource
        response = await pt.addResource();
        pt.log(LOGGING.INFO,'Added Sagemaker Edge Agent RPC API Resource. Response:', response);

        // Connect to MQTT broker
        await pt.connectToMQTTBroker(pt);

        // Run Json RPC Command Processor
        await pt.runJsonRpcCommandProcessor();
    } catch (ex) {
        try {
            console.error('Main: Exception Caught: ', ex);
            await pt.disconnect();
            process.exit(1);
        } catch (err) {
            console.error('Main: Exception on closing the Edge Core connection: ', err);
            process.exit(1);
        }
    }
})();
