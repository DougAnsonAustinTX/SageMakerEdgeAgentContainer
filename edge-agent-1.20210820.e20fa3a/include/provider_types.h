#pragma once

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

// TODO: These defines need to be verified before final release
#define PROVIDER_MAX_MODEL_NAME_LEN 256
#define PROVIDER_MAX_MODEL_VER_LEN 64
#define PROVIDER_MAX_METRIC_NAME_LEN 100
#define PROVIDER_MAX_TIMESTAMP_LEN 32
#define PROVIDER_MAX_METRICS_PER_MODEL 32
#define PROVIDER_MAX_DIMENSION_KEY_LEN 64
#define PROVIDER_MAX_DIMENSION_VAL_LEN 256
#define PROVIDER_MAX_DIMENSIONS 32

#define PROVIDER_MAX_CONFIG 256

typedef struct SMEdgeConfigElement {
    const char* key;
    const char* value;
} SMEdgeConfigElement;

typedef struct SMEdgeRegistrationData {
    bool active;
    long ttl;
} SMEdgeRegistrationData;

typedef struct SMEdgeDimension {
    char key[PROVIDER_MAX_DIMENSION_KEY_LEN];
    char val[PROVIDER_MAX_DIMENSION_VAL_LEN];
} SMEdgeDimension;

typedef struct SMEdgeMetric {
    char metricName[PROVIDER_MAX_METRIC_NAME_LEN + 1];
    double metricValue;
    char timestamp[PROVIDER_MAX_TIMESTAMP_LEN + 1]; // ISO 8601 timestamp
    SMEdgeDimension dimensions[PROVIDER_MAX_DIMENSIONS];
} SMEdgeMetric;

typedef struct SMEdgeModelInfo {
    char name[PROVIDER_MAX_MODEL_NAME_LEN + 1];   // loaded models at the time of hb
    char version[PROVIDER_MAX_MODEL_VER_LEN + 1]; // loaded models at the time of hb
    int num_metrics;                          // number of metrics populated
    SMEdgeMetric metrics[PROVIDER_MAX_METRICS_PER_MODEL];
} SMEdgeModelInfo;

#ifdef __cplusplus
} // Open extern "C" block
#endif // __cplusplus
