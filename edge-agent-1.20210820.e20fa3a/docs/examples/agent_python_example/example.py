import grpc
from PIL import Image
import agent_pb2
import agent_pb2_grpc
import os
from argparse import ArgumentParser

# Uncomment this for grpc debug log
# os.environ['GRPC_VERBOSITY'] = 'DEBUG'

agent_socket = "unix:///tmp/sagemaker_edge_agent_example.sock"

agent_channel = grpc.insecure_channel(
    agent_socket, options=(("grpc.enable_http_proxy", 0),)
)

agent_client = agent_pb2_grpc.AgentStub(agent_channel)


def list_models():
    return agent_client.ListModels(agent_pb2.ListModelsRequest())


def list_model_tensors(models):
    return {
        model.name: {
            "inputs": model.input_tensor_metadatas,
            "outputs": model.output_tensor_metadatas,
        }
        for model in list_models().models
    }


def load_model(name, url):
    load_request = agent_pb2.LoadModelRequest()
    load_request.url = url
    load_request.name = name
    return agent_client.LoadModel(load_request)


def unload_model(name):
    unload_request = agent_pb2.UnLoadModelRequest()
    unload_request.name = name
    return agent_client.UnLoadModel(unload_request)


def predict_image(model_name, image_tensor_name, image_path):
    image_tensor = agent_pb2.Tensor()
    image_tensor.byte_data = Image.open(image_path).tobytes()
    image_tensor_metadata = list_model_tensors(list_models())[model_name]["inputs"][0]
    image_tensor.tensor_metadata.name = image_tensor_metadata.name
    image_tensor.tensor_metadata.data_type = image_tensor_metadata.data_type
    for shape in image_tensor_metadata.shape:
        image_tensor.tensor_metadata.shape.append(shape)
    predict_request = agent_pb2.PredictRequest()
    predict_request.name = model_name
    predict_request.tensors.append(image_tensor)
    predict_response = agent_client.Predict(predict_request)
    return predict_response


def main():
    parser = ArgumentParser(description="Agent python example")
    parser.add_argument("--model_url", type=str, help="model folder path")
    parser.add_argument(
        "--model_name", type=str, help="name the model you loaded with agent"
    )
    parser.add_argument("--image_path", type=str, help="inference image path")
    parser.add_argument(
        "--image_tensor_name",
        type=str,
        help="tensor name is different for different framework",
    )
    args = parser.parse_args()

    print("LoadModel!")
    load_model(args.model_name, args.model_url)
    print("ListModels!")
    print(list_models())
    print("Predict!")
    predict_image(args.model_name, args.image_tensor_name, args.image_path)
    print("UnloadModel!")
    unload_model(args.model_name)


if __name__ == "__main__":
    main()
