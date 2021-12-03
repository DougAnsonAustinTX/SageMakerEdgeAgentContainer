# SageMaker Edge Management agent configuration

SageMaker Edge Manager agent can be run as a standalone process in the form of an Executable and Linkable Format (ELF) executable binary or can be linked against as a Dynamic Shared Object (.dso). Running as a standalone executable binary is the preferred mode and is supported on Linux. Running as a shared object (.dll) is supported on Windows.

For both cases, the SageMaker Edge Manager needs to be configured with a config file (JSON formatted), for the agent to initialize,setup and communicate with cloud.

There are different sections to this configuration file. In this document we go over configurations, by section

## Device identification configuration

These fields help identify the device uniquely.


1. `sagemaker_edge_core_device_name` : The name of the device, this device name needs to be registered along with device fleet in the SageMaker Edge Manager console.

2. `sagemaker_edge_core_device_fleet_name`: The name of the fleet the device belongs to. 

## Network connectivity configuration

For Network configuration, we need to download root certificate.
This certificate validates model artifacts signed by AWS before loading them onto your edge devices.
Replace <OS> corresponding to your platform from the list of supported operation systems and replace <REGION> with your AWS region. 

```bash
aws s3 cp s3://sagemaker-edge-release-store-us-west-2-<OS>/Certificates/<REGION>/<REGION>.pem .
```

These configurations are used to connect with network for validation, heartbeats and uploads. 
Even if there is a problem with these configs, the inference requests in the agent will work in offline mode.

1. `sagemaker_edge_core_region`: AWS region associated with device, fleet and buckets. This corresponds to the region in which the device is registered and S3 bucket is created (they are expected to be the same.). The models themselves can be compiled in a different region, this configuration is NOT related to model compilation region

2. `sagemaker_edge_core_root_certs_path`: Absolute folder path to root certificates. This is used for validating the device with the relevant AWS account.

3. `sagemaker_edge_provider_aws_ca_cert_file`: Absolute path to Amazon Root CA certificate (AmazonRootCA1.pem). This is used for validating the device with the relevant AWS account. AmazonCA is AWS's own certificate, authority for validation purposes. [Download](https://www.amazontrust.com/repository/AmazonRootCA1.pem)

4. `sagemaker_edge_provider_aws_cert_file`: Absolute path to AWS IoT signing root certificate (*.pem.crt). IOT credential used for validating network connectivity

5. `sagemaker_edge_provider_aws_cert_pk_file`: Absolute path to AWS IoT private key. (*.pem.key). IOT credential used for validating network connectivity

6. `sagemaker_edge_provider_aws_iot_cred_endpoint`: AWS IoT credentials endpoint (identifier.iot.region.amazonaws.com). Endpoint is used for credential validation. 
See, [Connecting devices](https://docs.aws.amazon.com/iot/latest/developerguide/iot-connect-devices.html) to AWS IoT for more information. 

7. `sagemaker_edge_provider_provider`: This indicates the implementation of provider interface being used. The provider interface communicates with the end network services for uploads, heartbeats and registration validation. By default this is set to *"Aws"*. We allow custom implementations of the provider interface. By default *"Aws"* implementation is used. Can be set to *None* for no provider or *Custom* for custom implementation with relevant shared object path provided in the following config

8. `sagemaker_edge_provider_provider_path`: This string, provides the absolute path to the provider implementation shared object. (.so or .dll file). The *"Aws"* provider dll/so file is provided with the agent release. This field is mandatory.

9. `sagemaker_edge_provider_s3_bucket_name`: Name of Amazon S3 bucket (not the Amazon S3 bucket URI). Bucket must have *â€˜sagemakerâ€™* string within its name. This where uploads are done to.

## Logging level configuration

1. `sagemaker_edge_log_verbose` : The logging level from the agent. By default this is set to *false*. When set to true, debug logs are printed by the agent (This is optional)

## Capture Data Configuration

Capture Data is a feature that enables, uploading, inference inputs, inference outputs and auxiliary data related to an inference to an associated S3 bucket/ local filesystem for future analysis. This is engaged with captureData API calls.

1. `sagemaker_edge_core_capture_data_destination`: The destination for uploading capture data. Select either â€œCloudâ€ or â€œDiskâ€. By default this set to "Disk". Setting to "Disk" will write the input/output tensor(s) and auxiliary data to the local file system at a location of preference. When writing to "Cloud" use the s3 bucket name provided in the *sagemaker_edge_provider_s3_bucket_name* configuration.

2. `sagemaker_edge_core_capture_data_disk_path` : Set the absolute path in  the local filesystem, where capture data files will be written into when "Disk" is the destination. Not used when destination is cloud.

3. `sagemaker_edge_core_folder_prefix`: When uploading to "Cloud" (S3) will be the parent prefix under the bucket, where capture data is stored. When using "Disk" will be a sub-folder under `sagemaker_edge_core_capture_data_disk_path`.

Before proceeding to further configurations, a quick note on how capture data requests are handled. They are handled asynchronously, with a backing in memory circular buffer, which buffers the requests and uploads them in batches, depending on configurations.

4. `sagemaker_edge_core_capture_data_buffer_size`: Capture data circular buffer size, indicates maximum number of requests stored in the buffer. Integer value.

5. `sagemaker_edge_core_capture_data_batch_size`: Capture data batch size, indicates size of a batch of requests that are handled from the buffer. Has to be less than `sagemaker_edge_core_capture_data_buffer_size`. A maximum of half the size of the buffer recommended for batch size. Integer value.

6. `sagemaker_edge_core_capture_data_push_period_seconds`: A batch of requests, in the buffer is handled , when there are batch size requests in the buffer, or when a time period hits (Which ever comes first). This configuration sets that time period. Integer value indicating time in seconds.

When tensor files are written using capture data, some of them can be big, some of them can be small. For a batch of these files(batch size or when time hits) a manifest is created. Whenever write from buffer is triggered a manifest of all the tensor files and meta info is created. When the tensor byte data is small enough, we base64 encode the bytes, within the manifest instead of creating separate tensor files

7. `sagemaker_edge_core_capture_data_base64_embed_limit`: Sets this limit, for maximum data size that can be base64 encoded. Default and maximum value  allowed is 3KB (4KB base64 encoded). Integer value. Use this configuration to reduce this limit cannot go over 3KB default.

`sagemaker_edge_core_capture_data_destination` is one of the primary capture data flag, when set to Disk, a batch of records is written to disk, when batch size is reached. When set to Cloud this causes the same batch to instead uploaded to cloud using the provider API default being our own Aws cpp based implementation
There are cases where customer would want to write to disk first and upload to cloud later. E.g places where  network access is limited.
In such cases when `sagemaker_edge_core_capture_data_destination` is set to Disk an additional config called *sagemaker_edge_core_capture_data_periodic_upload* can be used.
This will take the files written to disk and upload it to the cloud
When `sagemaker_edge_core_capture_data_destination` is set to Cloud, periodic upload configuration does nothing

8. `sagemaker_edge_core_capture_data_periodic_upload` : Enables periodic upload. By default disabled and set to *false*. Boolean value.

9. `sagemaker_edge_core_capture_data_periodic_upload_period_seconds` : Similar to *sagemaker_edge_core_capture_data_push_period_seconds*, but this timer is for the periodic uploader that fetches from "Disk". Integer value for time in seconds.

## Telemetry Configuration
1. `sagemaker_edge_telemetry_libsystemd_path`: The agent crash counter metric is implemented with systemd and it's working for Linux only. To enable the crash counter metric, please set the absolute path of libsystemd. The default libsystemd path can be found by running "whereis libsystemd" in the device terminal.

## Sample Configuration

The below is how a configuration file could look like, with default Aws provider and no periodic upload.

```json
{
    "sagemaker_edge_core_device_name": "device-name",
    "sagemaker_edge_core_device_fleet_name": "fleet-name",
    "sagemaker_edge_core_region": "region",
    "sagemaker_edge_core_root_certs_path": "<Absolute path to root certificates>",
    "sagemaker_edge_provider_provider": "Aws",
    "sagemaker_edge_provider_provider_path" : "/path/to/libprovider-aws.so",
    "sagemaker_edge_provider_aws_ca_cert_file": "<Absolute path to Amazon Root CA certificate>/AmazonRootCA1.pem",
    "sagemaker_edge_provider_aws_cert_file": "<Absolute path to AWS IoT signing root certificate>/device.pem.crt",
    "sagemaker_edge_provider_aws_cert_pk_file": "<Absolute path to AWS IoT private key.>/private.pem.key",
    "sagemaker_edge_provider_aws_iot_cred_endpoint": "https://<AWS IoT Endpoint Address>",
    "sagemaker_edge_core_capture_data_destination": "Cloud",
    "sagemaker_edge_provider_s3_bucket_name": "sagemaker-bucket-name",
    "sagemaker_edge_core_folder_prefix": "prefix-name",
    "sagemaker_edge_core_capture_data_buffer_size": 30,
    "sagemaker_edge_core_capture_data_batch_size": 10,
    "sagemaker_edge_core_capture_data_push_period_seconds": 4000,
    "sagemaker_edge_core_capture_data_base64_embed_limit": 2,
    "sagemaker_edge_log_verbose": false,
    "sagemaker_edge_core_capture_data_periodic_upload":false
}
```

## Generating configuration for use with agent.

A python script utility is provided in the release, to generate a config with filename `sagemaker_edge_agent_config.json`.

The script can be found in examples directory

```python
python examples/agent_config_generator/sagemaker_edge_agent_config_gen.py
(Optional)Device Name: "my-device-name"
...
```

