// GENERATED CODE -- DO NOT EDIT!

/* eslint-disable */
"use strict";

const grpc = require("grpc");
const agent_pb = require("./agent_pb.js");

function serialize_AWS_SageMaker_Edge_PredictRequest(arg) {
  if (!arg instanceof agent_pb.PredictRequest) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.PredictRequest");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_PredictRequest(arg) {
  return agent_pb.PredictRequest.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_PredictResponse(arg) {
  if (!arg instanceof agent_pb.PredictResponse) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.PredictResponse");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_PredictResponse(arg) {
  return agent_pb.PredictResponse.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_LoadModelRequest(arg) {
  if (!arg instanceof agent_pb.LoadModelRequest) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.LoadModelRequest");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_LoadModelRequest(arg) {
  return agent_pb.LoadModelRequest.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_LoadModelResponse(arg) {
  if (!arg instanceof agent_pb.LoadModelResponse) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.LoadModelResponse");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_LoadModelResponse(arg) {
  return agent_pb.LoadModelResponse.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_UnLoadModelRequest(arg) {
  if (!arg instanceof agent_pb.UnLoadModelRequest) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.UnLoadModelRequest");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_UnLoadModelRequest(arg) {
  return agent_pb.UnLoadModelRequest.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_UnLoadModelResponse(arg) {
  if (!arg instanceof agent_pb.UnLoadModelResponse) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.UnLoadModelResponse");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_UnLoadModelResponse(arg) {
  return agent_pb.UnLoadModelResponse.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_ListModelsRequest(arg) {
  if (!arg instanceof agent_pb.ListModelsRequest) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.ListModelsRequest");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_ListModelsRequest(arg) {
  return agent_pb.ListModelsRequest.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_ListModelsResponse(arg) {
  if (!arg instanceof agent_pb.ListModelsResponse) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.ListModelsResponse");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_ListModelsResponse(arg) {
  return agent_pb.ListModelsResponse.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_DescribeModelRequest(arg) {
  if (!arg instanceof agent_pb.DescribeModelRequest) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.DescribeModelRequest");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_DescribeModelRequest(arg) {
  return agent_pb.DescribeModelRequest.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_DescribeModelResponse(arg) {
  if (!arg instanceof agent_pb.DescribeModelResponse) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.DescribeModelResponse");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_DescribeModelResponse(arg) {
  return agent_pb.DescribeModelResponse.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_CaptureDataRequest(arg) {
  if (!arg instanceof agent_pb.CaptureDataRequest) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.CaptureDataRequest");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_CaptureDataRequest(arg) {
  return agent_pb.CaptureDataRequest.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_CaptureDataResponse(arg) {
  if (!arg instanceof agent_pb.CaptureDataResponse) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.CaptureDataResponse");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_CaptureDataResponse(arg) {
  return agent_pb.CaptureDataResponse.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_GetCaptureDataStatusRequest(arg) {
  if (!arg instanceof agent_pb.GetCaptureDataStatusRequest) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.GetCaptureDataStatusRequest");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_GetCaptureDataStatusRequest(arg) {
  return agent_pb.GetCaptureDataStatusRequest.deserializeBinary(new Uint8Array(arg));
}

function serialize_AWS_SageMaker_Edge_GetCaptureDataStatusResponse(arg) {
  if (!arg instanceof agent_pb.GetCaptureDataStatusResponse) {
    throw new Error("Expected argument of type AWS.SageMaker.Edge.GetCaptureDataStatusResponse");
  }

  return Buffer.from(arg.serializeBinary());
}

function deserialize_AWS_SageMaker_Edge_GetCaptureDataStatusResponse(arg) {
  return agent_pb.GetCaptureDataStatusResponse.deserializeBinary(new Uint8Array(arg));
}

const AgentService = exports.AgentService = {
  predict: {
    path: "/AWS.SageMaker.Edge.Agent/Predict",
    requestStream: false,
    responseStream: false,
    requestType: agent_pb.PredictRequest,
    responseType: agent_pb.PredictResponse,
    requestSerialize: serialize_AWS_SageMaker_Edge_PredictRequest,
    requestDeserialize: deserialize_AWS_SageMaker_Edge_PredictRequest,
    responseSerialize: serialize_AWS_SageMaker_Edge_PredictResponse,
    responseDeserialize: deserialize_AWS_SageMaker_Edge_PredictResponse
  },
  loadModel: {
    path: "/AWS.SageMaker.Edge.Agent/LoadModel",
    requestStream: false,
    responseStream: false,
    requestType: agent_pb.LoadModelRequest,
    responseType: agent_pb.LoadModelResponse,
    requestSerialize: serialize_AWS_SageMaker_Edge_LoadModelRequest,
    requestDeserialize: deserialize_AWS_SageMaker_Edge_LoadModelRequest,
    responseSerialize: serialize_AWS_SageMaker_Edge_LoadModelResponse,
    responseDeserialize: deserialize_AWS_SageMaker_Edge_LoadModelResponse
  },
  unLoadModel: {
    path: "/AWS.SageMaker.Edge.Agent/UnLoadModel",
    requestStream: false,
    responseStream: false,
    requestType: agent_pb.UnLoadModelRequest,
    responseType: agent_pb.UnLoadModelResponse,
    requestSerialize: serialize_AWS_SageMaker_Edge_UnLoadModelRequest,
    requestDeserialize: deserialize_AWS_SageMaker_Edge_UnLoadModelRequest,
    responseSerialize: serialize_AWS_SageMaker_Edge_UnLoadModelResponse,
    responseDeserialize: deserialize_AWS_SageMaker_Edge_UnLoadModelResponse
  },
  listModels: {
    path: "/AWS.SageMaker.Edge.Agent/ListModels",
    requestStream: false,
    responseStream: false,
    requestType: agent_pb.ListModelsRequest,
    responseType: agent_pb.ListModelsResponse,
    requestSerialize: serialize_AWS_SageMaker_Edge_ListModelsRequest,
    requestDeserialize: deserialize_AWS_SageMaker_Edge_ListModelsRequest,
    responseSerialize: serialize_AWS_SageMaker_Edge_ListModelsResponse,
    responseDeserialize: deserialize_AWS_SageMaker_Edge_ListModelsResponse
  },
  describeModel: {
    path: "/AWS.SageMaker.Edge.Agent/DescribeModel",
    requestStream: false,
    responseStream: false,
    requestType: agent_pb.DescribeModelRequest,
    responseType: agent_pb.DescribeModelResponse,
    requestSerialize: serialize_AWS_SageMaker_Edge_DescribeModelRequest,
    requestDeserialize: deserialize_AWS_SageMaker_Edge_DescribeModelRequest,
    responseSerialize: serialize_AWS_SageMaker_Edge_DescribeModelResponse,
    responseDeserialize: deserialize_AWS_SageMaker_Edge_DescribeModelResponse
  },
  captureData: {
    path: "/AWS.SageMaker.Edge.Agent/CaptureData",
    requestStream: false,
    responseStream: false,
    requestType: agent_pb.CaptureDataRequest,
    responseType: agent_pb.CaptureDataResponse,
    requestSerialize: serialize_AWS_SageMaker_Edge_CaptureDataRequest,
    requestDeserialize: deserialize_AWS_SageMaker_Edge_CaptureDataRequest,
    responseSerialize: serialize_AWS_SageMaker_Edge_CaptureDataResponse,
    responseDeserialize: deserialize_AWS_SageMaker_Edge_CaptureDataResponse
  },
  getCaptureDataStatus: {
    path: "/AWS.SageMaker.Edge.Agent/GetCaptureDataStatus",
    requestStream: false,
    responseStream: false,
    requestType: agent_pb.GetCaptureDataStatusRequest,
    responseType: agent_pb.GetCaptureDataStatusResponse,
    requestSerialize: serialize_AWS_SageMaker_Edge_GetCaptureDataStatusRequest,
    requestDeserialize: deserialize_AWS_SageMaker_Edge_GetCaptureDataStatusRequest,
    responseSerialize: serialize_AWS_SageMaker_Edge_GetCaptureDataStatusResponse,
    responseDeserialize: deserialize_AWS_SageMaker_Edge_GetCaptureDataStatusResponse
  },
};

exports.AgentClient = grpc.makeGenericClientConstructor(AgentService);