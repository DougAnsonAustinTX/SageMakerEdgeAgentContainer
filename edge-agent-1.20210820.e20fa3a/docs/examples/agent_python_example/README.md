## SageMaker Edge Agent Python Client Example

### Sample client program information
This folder contains a sample client python program, that can communicate with
`sagemaker_edge_agent` via GRPC.

The program has variety of API calls to the `sagemaker_edge_agent`,
including:
- `load_model(model_name, model_url)`
- `list_models()`
- `predict_image(model_name, image_tensor_name, image_path)`
- `unload_model(model_name)`

The API documentation for the commands can be found under
[agent.proto](./agent.proto) protobuf file.

The program currently assumes an image input based model is being loaded. Other
models will not work without code changes to input handling.
The input is expected to be a bitmap image  of shape `W x H x C` (Width, Height,
Channels).

### How to run
+ Setup the `sagemaker_edge_agent` binary and run it.
```bash
./sagemaker_edge_agent_binary -a /tmp/sagemaker_edge_agent_example.sock -c neo_config.json
```
+ With the `sagemaker_edge_agent` binary running, execute the following:
```bash
./run.sh [model_path] [model_name] [tensor_name] [image_path]
```
