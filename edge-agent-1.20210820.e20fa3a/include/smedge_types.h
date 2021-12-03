#pragma once

#include <map>
#include <stdint.h>
#include <string>

/* special symbols for DLL library on Windows */
#ifdef __cplusplus
extern "C" { // Open extern "C" block
#endif       // __cplusplus

#if defined(_MSC_VER) || defined(_WIN32)
#define SMEDGE_DLL __declspec(dllexport)
#else
#define SMEDGE_DLL
#endif // defined(_MSC_VER) || defined(_WIN32)

// Note: previously this was a UUID we still accept UUID as a device name but don't mandate this
// anymore
#define MAX_DEVICE_NAME_LEN 63
#define MAX_FLEETNAME_LEN 1023

// https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html
#define S3_MAX_SIZE 1023
#define MAX_URI_LEN 1023
#define MAX_PATH_LEN 1023
#define MAX_REGION_LEN 15
#define MAX_DATA_DST_LEN 15
#define MAX_PROVIDER_TYPE_LEN 31
#define MAX_DATA_CAPTURE_SIZE_BASE_64 3072

typedef enum {
    SMEDGE_OK = 0,
    SMEDGE_ERR,
    SMEDGE_IN_PROGRESS,
    SMEDGE_ERR_NO_PROVIDER,
    SMEDGE_ERR_NOT_REG,
    SMEDGE_BUSY,
    SMEDGE_UNKNOWN,
    SMEDGE_NOT_FOUND,
    SMEDGE_BAD_CONFIG,
    SMEDGE_INVALID_ARGUMENT,
    SMEDGE_ALREADY_EXISTS,
    SMEDGE_FAILED_PRECONDITION,
    SMEDGE_NO_NETWORK_ACCESS,
} ErrorType;

typedef struct {
    ErrorType error;
    const char* reason;
} SMEdgeStatus;

typedef struct {
    ErrorType error;
    const char* reason;
    void* data;
} SMEdgeStatusData;

namespace smedge {
namespace utils {


const char* makeSMEdgeReason(ErrorType err);

inline SMEdgeStatus makeSMEdgeStatus(ErrorType err) {
    SMEdgeStatus status;
    status.error = err;
    status.reason = smedge::utils::makeSMEdgeReason(err);
    return status;
}

inline SMEdgeStatusData makeSMEdgeStatusData(ErrorType err, void* data) {
    SMEdgeStatusData status;
    status.error = err;
    status.reason = smedge::utils::makeSMEdgeReason(err);
    status.data = data;
    return status;
}

}; // namespace utils
}; // namespace smedge

// CAUTION: member of this struct, their order, and size must exactly
// match those defined in canaries/core_csharp/src/SageMakerEdgeCore.cs
typedef struct {
    char sagemaker_edge_core_config_path[MAX_PATH_LEN + 1];
    char sagemaker_edge_core_region[MAX_REGION_LEN +
                                    1]; // Based on current longest region ap-northeast-x (1,2,3)
    char sagemaker_edge_core_device_name[MAX_DEVICE_NAME_LEN + 1];
    char sagemaker_edge_core_iot_thing_name[MAX_DEVICE_NAME_LEN + 1];
    char sagemaker_edge_core_device_fleet_name[MAX_FLEETNAME_LEN + 1];
    char sagemaker_edge_provider_s3_bucket_name[S3_MAX_SIZE + 1];
    char sagemaker_edge_core_folder_prefix[S3_MAX_SIZE + 1];
    char sagemaker_edge_core_endpoint_override[MAX_URI_LEN + 1];
    char sagemaker_edge_provider_provider_path[MAX_PATH_LEN + 1];
    char sagemaker_edge_provider_provider[MAX_PROVIDER_TYPE_LEN + 1]; // can be default/none, aws or custom
    char sagemaker_edge_core_root_certs_path[MAX_PATH_LEN + 1];
    int sagemaker_edge_core_capture_data_buffer_size;
    int sagemaker_edge_core_capture_data_batch_size;
    int sagemaker_edge_core_capture_data_push_period_seconds;            // Seconds
    int sagemaker_edge_core_capture_data_periodic_upload_period_seconds; // Seconds
    bool sagemaker_edge_core_capture_data_periodic_upload;
    unsigned long sagemaker_edge_core_capture_data_base64_embed_limit; // In bytes
    char sagemaker_edge_core_capture_data_destination[MAX_DATA_DST_LEN + 1];  // other "Disk", "Cloud"
    char sagemaker_edge_core_capture_data_disk_path[MAX_PATH_LEN + 1];
    char sagemaker_edge_provider_aws_cert_file[MAX_PATH_LEN + 1];
    char sagemaker_edge_provider_aws_cert_pk_file[MAX_PATH_LEN + 1];
    char sagemaker_edge_provider_aws_ca_cert_file[MAX_PATH_LEN + 1];
    char sagemaker_edge_provider_aws_iot_cred_endpoint[MAX_URI_LEN + 1];
    bool sagemaker_edge_log_verbose;
    char sagemaker_edge_telemetry_libsystemd_path[MAX_PATH_LEN + 1];
} SMEdgeConfig;

#ifdef __cplusplus
} // Open extern "C" block
#endif // __cplusplus
