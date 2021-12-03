#pragma once

#include <provider_common/provider_types.h>
#include <provider_common/smedge_types.h>
#include <stdint.h>

/* special symbols for DLL library on Windows */
#ifdef __cplusplus
extern "C" { // Open extern "C" block
#endif       // __cplusplus

#if defined(_MSC_VER) || defined(_WIN32)
#define SMEDGE_DLL __declspec(dllexport)
#else
#define SMEDGE_DLL
#endif // defined(_MSC_VER) || defined(_WIN32)


// Initialize hook for provider
SMEDGE_DLL SMEdgeStatus initProvider(void** smedge_ctx);

// Shutdown hook for provider
SMEDGE_DLL SMEdgeStatus shutdownProvider(void* smedge_ctx);

SMEDGE_DLL SMEdgeStatus uploadSampleDataToCloud(void* smedge_ctx, const char* data_bytes,
                                          const int data_bytes_size, const char* filename,
                                          const char* mime_type);

// Syncup local configuration to provider
SMEDGE_DLL SMEdgeStatus initConfiguration(void* smedge_ctx, SMEdgeConfigElement conf[], int num_conf);

SMEDGE_DLL SMEdgeStatus initCloudClient(void* smedge_ctx);

SMEDGE_DLL SMEdgeStatus sendHeartBeatToCloud(void* smedge_ctx, SMEdgeModelInfo** models, int model_count,
                                       SMEdgeMetric** agent_metrics, int agent_metric_count);

SMEDGE_DLL SMEdgeStatus getDeviceRegistrationFromCloud(void* smedge_ctx, SMEdgeRegistrationData* reg_data);

/*!
 \brief Check Network status for Provider API, check if the necessary authorized endpoint(s) can be reached.
 \param smedge_ctx pointer SM Edge context.
 \return SMEDGE_OK when Network endpoint(s) is reacheable , SMEDGE_NO_NETWORK_ACCESS when endpoint(s) are not reachable.
*/
SMEDGE_DLL SMEdgeStatus getNetworkStatus(void* smedge_ctx);


#ifdef __cplusplus
} // Open extern "C" block
#endif // __cplusplus
