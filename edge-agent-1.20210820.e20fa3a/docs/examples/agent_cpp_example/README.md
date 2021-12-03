## SageMaker Agent Client Example

### Sample client program information
This folder contains a sample client  program, that can communicate with `sagemaker_edge_agent` via GRPC.

The program accepts variety of commands to the `sagemaker_edge_agent`, including:
- ListModels
- LoadModel
- UnloadModel
- DescribeModel
- Predict
- PredictSHM
- PredictAndCapture
- PredictSHMAndCapture

The API documentation for the commands can be found under [sagemaker_edge_agent.proto](./sagemaker_edge_agent.proto) protobuf file.

The program currently assumes an image input based model is being loaded. Other models will not work without code changes to input handling.
The input is expected to be a bitmap image  of shape W x H x C (Width, Height, Channels).

Typical call flow to `sagemaker_edge_agent` would be as follows.
```
LoadModel(model_name) -> ListModels() -> Predict(model_name, input) -> UnLoadModel(model_name)
```

### How to compile the program
To compile the program from the example folder.

```bash
$ mkdir build; cd build; cmake -DCMAKE_BUILD_TYPE=Release ..; make -j$(nproc)
```

### How to run
Setup the `sagemaker_edge_agent` binary and run it.
With the `sagemaker_edge_agent` binary running, execute the following:

```bash
# Running from example's build/ directory
# Get List of Available commands
$ ./sagemaker_edge_agent_client_example
Usage: ./client [command_name]
Commands:
     ListModels
     LoadModel [model_path] [model_name]
     UnloadModel [model_name]
     DescribeModel [model_name]
     Predict [model_name] [input_bmp_image] [input_name] [w] [h] [c]
     PredictSHM [model_name] [input_bmp_image] [input_name] [w] [h] [c]
     PredictAndCapture [model_name] [input_bmp_image] [input_name] [w] [h] [c]
     PredictSHMAndCapture [model_name] [input_bmp_image] [input_name] [w] [h] [c]

# Load the resnet18 model
$ ./sagemaker_edge_agent_client_example LoadModel /home/ubuntu/models/cpu/resnet18_v1 resnet18
Model resnet18 located at  /home/ubuntu/models/cpu/resnet18_v1 loaded
LoadModel succeeded

# List all models
$ ./sagemaker_edge_agent_client_example ListModels
There are 1 models
Model 0  resnet18
ListModels succeeded

# Run predict with the sample bmp image on the model (Output Truncated in README)
$ ./sagemaker_edge_agent_client_example Predict ssd /home/ubuntu/images/street_small.bmp data 224 224 3
Done reading the image
Predict succeeded
Flattened RAW Output Tensor:1
-3.03011 2.88421 -5.76567 -4.84417 -1.25533 -0.416071 -7.33233 0.0306963 -3.2556 -5.48266 -1.4798 

# UnLoad the model
$ ./sagemaker_edge_agent_client_example UnloadModel resnet18
Model resnet18 has been unloaded
UnLoadModel succeeded

```
