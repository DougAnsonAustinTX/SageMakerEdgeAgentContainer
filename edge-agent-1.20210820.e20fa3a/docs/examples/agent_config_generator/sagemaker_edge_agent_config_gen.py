import json
import re
import os

class Error(Exception):
    """Base class for other exceptions"""
    pass

class DataCaptureDestError(Error):
    def __init__(self, message="Data Capture Destination should be: Disk || Cloud"):
        super().__init__(message)

class BucketRegexError(Error):
    def __init__(self, message="Bucket Name should contain key word: sagemaker!"):
        super().__init__(message)

class BoolError(Error):
    def __init__(self, message="Input must be true || false!"):
        super().__init__(message)

class RegionError(Error):
    def __init__(self, message="Choose region from: us-east-1 | us-east-2 | us-west-2 | eu-central-1 | ap-northeast-1 | eu-west-1"):
        super().__init__(message)

class ProviderError(Error):
    def __init__(self, message="Choose Provider from: Aws | Custom | None"):
        super().__init__(message)

class PathError(Error):
    def __init__(self, message="Please check if the path exsits and is absolute path!"):
        super().__init__(message)

config = {}

def gen_device_name():
    device_name = input('(Optional)Device Name: ')
    if device_name:
        config["sagemaker_edge_core_device_uuid"] = device_name

def gen_device_fleet_name():
    while True:
        device_fleet_name = input('Device Fleet Name: ')
        if not device_fleet_name:
            print("Device fleet name must be present!")
        else:
            config["sagemaker_edge_core_device_fleet_name"] = device_fleet_name
            break

def gen_region():
    regions = ['us-east-1', 'us-east-2', 'us-west-2', 'eu-central-1', 'ap-northeast-1', 'eu-west-1']
    print('Choose region from: us-east-1 | us-east-2 | us-west-2 | eu-central-1 | ap-northeast-1 | eu-west-1')
    while True:
        try:
            region = input('AWS Region: ')
            if region in regions:
                config["sagemaker_edge_core_region"] = region
                break
            else:
                raise RegionError()
        except RegionError as e:
            print('Invalid input. ', e)

def gen_root_certs_path():
    while True:
        try:
            root_certs_path = input('Root Certificates Folder Path: ')
            if os.path.isdir(root_certs_path) and os.path.isabs(root_certs_path):
                config["sagemaker_edge_core_root_certs_path"] = root_certs_path
                break
            else:
                raise PathError()
        except PathError as e:
            print('Invalid path. ', e)

def gen_provider():
    print('Choose Provider from: Aws | Custom | None')
    provider_map = {'aws': 'Aws', 'custom': 'Custom', 'none': 'None'}
    while True:
        try:
            provider = input("Provider: ")
            if provider.lower() in provider_map:
                config["sagemaker_edge_provider_provider"] = provider_map[provider.lower()]
                break
            else:
                raise ProviderError()
        except ProviderError as e:
            print('Invalid provider. ', e)
    return provider_map[provider.lower()]

def gen_provider_path():
    while True:
        try:
            provider_path = input("Provider Absolute Path: ")
            if os.path.isfile(provider_path) and os.path.isabs(provider_path):
                config["sagemaker_edge_provider_provider_path"] = provider_path
                break
            else:
                raise PathError()
        except PathError as e:
            print('Invalid path. ', e)

def gen_aws_ca_cert():
    while True:
        try:
            aws_ca_cert = input("Path to AWS CA Certificate: ")
            if os.path.isfile(aws_ca_cert) and os.path.isabs(aws_ca_cert):
                config["sagemaker_edge_provider_aws_ca_cert_file"] = aws_ca_cert
                break
            else:
                raise PathError()
        except PathError as e:
            print('Invalid path. ', e)

def gen_iot_cert():
    while True:
        try:
            iot_cert = input("Path to AWS IoT Certificate: ")
            if os.path.isfile(iot_cert) and os.path.isabs(iot_cert):
                config["sagemaker_edge_provider_aws_cert_file"] = iot_cert
                break
            else:
                raise PathError()
        except PathError as e:
            print('Invalid path. ', e)

def gen_iot_key():
    while True:
        try:
            iot_key = input("Path to AWS IoT Private Key: ")
            if os.path.isfile(iot_key) and os.path.isabs(iot_key):
                config["sagemaker_edge_provider_aws_cert_pk_file"] = iot_key
                break
            else:
                raise PathError()
        except PathError as e:
            print('Invalid path. ', e)

def gen_iot_endpoint():
    iot_endpoint = input("Path to AWS IoT Endpoint: ")
    config["sagemaker_edge_provider_aws_iot_cred_endpoint"] = iot_endpoint

def gen_capture_data_dest():
    print('The Destination for Uploading Capture Data: Disk || Cloud')
    while True:
        try:
            dest = input('The Destination for Uploading Capture Data: ')
            if not dest or dest.lower() == 'disk':
                config["sagemaker_edge_core_capture_data_destination"] = 'Disk'
                break
            elif dest.lower() == 'cloud':
                config["sagemaker_edge_core_capture_data_destination"] = 'Cloud'
                break
            else:
                raise DataCaptureDestError()
        except DataCaptureDestError as e:
            print('Invalid destination entered!', e)
    return dest.lower()

def gen_capture_data_disk_path():
    print('If Capture Data is Disk, provide local path to save capture data')
    while True:
        try:
            disk_path = input('Absolute Path for Capture Data: ')
            if os.path.isdir(disk_path):
                config["sagemaker_edge_core_capture_data_disk_path"] = disk_path
                break
            else:
                raise PathError()
        except PathError as e:
            print('Invalid path. ', e)

def gen_capture_data_base64_limit():
    while True:
        try:
            limit = input('The Limit for Uploading Capture Data in bytes: ')
            if not limit:
                config["sagemaker_edge_core_capture_data_base64_embed_limit"] = 3072
                print('The default is set to 3 Kilobytes!')
                break
            elif 0 < int(limit) <= 3072:
                config["sagemaker_edge_core_capture_data_base64_embed_limit"] = int(limit)
                break
            else:
                print('The input value should be smaller then 3072')
                raise ValueError
        except ValueError as e:
            print('Invalid, please enter a number. ', e)

def gen_capture_data_periodic_upload():
    while True:
        try:
            upload = input('Capture Data Periodically Store on Disk: ')
            if not upload or upload.lower() == 'false':
                config["sagemaker_edge_core_capture_data_periodic_upload"] = False
                break
            elif upload.lower() == 'true':
                config["sagemaker_edge_core_capture_data_periodic_upload"] = True
                break
            else:
                raise BoolError()
        except BoolError as e:
            print('Invalid, please enter true or false. ', e)

def gen_capture_data_periodic_upload_period_seconds():
    while True:
        try:
            period = int(input('Enter Capture Data Period in second: '))
            config["sagemaker_edge_core_capture_data_periodic_upload_period_seconds"] = period
            break
        except ValueError as e:
            print('Invalid period, please enter a number. ', e)

def gen_bucket():
    print('Bucket Name should contain key word: sagemaker!')
    while True:
        try:
            bucket = input('The S3 Bucket Name for Uploading Capture Data: ')
            if re.compile('\W*(sagemaker)\W*', re.I).findall(bucket):
                config["sagemaker_edge_provider_s3_bucket_name"] = bucket
                break
            else:
                raise BucketRegexError()
        except BucketRegexError as e:
            print('Invalid bucket name entered!', e)

def gen_capture_data_folder():
    capture_folder = input('The Folder Name for Uploading Capture Data: ')
    config["sagemaker_edge_core_folder_prefix"] = capture_folder

def gen_capture_data_buffer_size():
    while True:
        try:
            buffer_size = int(input('Enter Capture Data Buffer Size: '))
            config["sagemaker_edge_core_capture_data_buffer_size"] = buffer_size
            break
        except ValueError as e:
            print('Invalid buffer size, please enter a number. ', e)
    return buffer_size

def gen_capture_data_batch_size(buffer_size):
    while True:
        try:
            batch_size = input('Enter Capture Data Batch Size: ')
            if not batch_size:
                config["sagemaker_edge_core_capture_data_batch_size"] = buffer_size//2
                break
            elif int(batch_size) <= buffer_size:
                config["sagemaker_edge_core_capture_data_batch_size"] = int(batch_size)
                break
            else:
                print("Batch size cannot be greater than buffer size, try a smaller number")
                raise ValueError
        except ValueError as e:
            print('Invalid batch size, please enter a number. ', e)

def gen_capture_data_period():
    while True:
        try:
            push_period = int(input('Enter Capture Data Push Period in Seconds: '))
            config["sagemaker_edge_core_capture_data_push_period_seconds"] = push_period
            break
        except ValueError as e:
            print('Invalid push period, please enter a number. ', e)

def gen_log_verbose():
    while True:
        try:
            log_verbose = input('(Optional)Set Debug Log: ')
            if not log_verbose or log_verbose.lower() == 'false':
                config["sagemaker_edge_log_verbose"] = False
                break
            elif log_verbose.lower() == 'true':
                config["sagemaker_edge_log_verbose"] = True
                break
            else:
                raise BoolError()
        except BoolError as e:
            print('Invalid input. ', e)

def config_generator():
    gen_device_name()
    gen_device_fleet_name()
    gen_region()
    gen_root_certs_path()
    provider = gen_provider()
    if provider == 'Aws':
        gen_aws_ca_cert()
        gen_iot_cert()
        gen_iot_key()
        gen_iot_endpoint()
        gen_provider_path()
    elif provider == 'Custom':
        gen_provider_path()
    dest = gen_capture_data_dest()
    if dest == 'disk':
        gen_capture_data_disk_path()
        gen_capture_data_periodic_upload()
        gen_capture_data_periodic_upload_period_seconds()
    elif dest == 'cloud':
        gen_bucket()
        gen_capture_data_folder()
        buffer_size = gen_capture_data_buffer_size()
        gen_capture_data_batch_size(buffer_size)
        gen_capture_data_period()
    gen_capture_data_base64_limit()
    gen_log_verbose()

if __name__ == '__main__':
    print('Please refer our docs regarding each config param.')
    print("\x1b]8;;https://docs.aws.amazon.com/sagemaker/latest/dg/edge.html\aSagemaker Edge Agent Config Instruction\x1b]8;;\a")
    print("Refer \x1b]8;;https://github.com/aws/amazon-sagemaker-examples/blob/master/sagemaker_edge_manager/sagemaker_edge_example/sagemaker_edge_example.ipynb\aSagemaker Edge Agent Example Notebook\x1b]8;;\a for more info about how to generate AWS IoT credentials")
    config_generator()
    with open("./sagemaker_edge_agent_config.json", "w") as f:
        json.dump(config, f, indent=4)
    print("Your Agent's Config file has been successfully generated in ./sagemaker_edge_agent_config.json")
