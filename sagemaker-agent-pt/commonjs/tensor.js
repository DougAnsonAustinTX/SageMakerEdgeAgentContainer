// source: agent.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

goog.provide('proto.AWS.SageMaker.Edge.Tensor');
goog.provide('proto.AWS.SageMaker.Edge.Tensor.DataCase');

goog.require('jspb.BinaryReader');
goog.require('jspb.BinaryWriter');
goog.require('jspb.Message');
goog.require('proto.AWS.SageMaker.Edge.SharedMemoryHandle');
goog.require('proto.AWS.SageMaker.Edge.TensorMetadata');

/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.AWS.SageMaker.Edge.Tensor = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.AWS.SageMaker.Edge.Tensor.oneofGroups_);
};
goog.inherits(proto.AWS.SageMaker.Edge.Tensor, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.AWS.SageMaker.Edge.Tensor.displayName = 'proto.AWS.SageMaker.Edge.Tensor';
}

/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.AWS.SageMaker.Edge.Tensor.oneofGroups_ = [[4,5]];

/**
 * @enum {number}
 */
proto.AWS.SageMaker.Edge.Tensor.DataCase = {
  DATA_NOT_SET: 0,
  BYTE_DATA: 4,
  SHARED_MEMORY_HANDLE: 5
};

/**
 * @return {proto.AWS.SageMaker.Edge.Tensor.DataCase}
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.getDataCase = function() {
  return /** @type {proto.AWS.SageMaker.Edge.Tensor.DataCase} */(jspb.Message.computeOneofCase(this, proto.AWS.SageMaker.Edge.Tensor.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.toObject = function(opt_includeInstance) {
  return proto.AWS.SageMaker.Edge.Tensor.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.AWS.SageMaker.Edge.Tensor} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.AWS.SageMaker.Edge.Tensor.toObject = function(includeInstance, msg) {
  var f, obj = {
    tensorMetadata: (f = msg.getTensorMetadata()) && proto.AWS.SageMaker.Edge.TensorMetadata.toObject(includeInstance, f),
    byteData: msg.getByteData_asB64(),
    sharedMemoryHandle: (f = msg.getSharedMemoryHandle()) && proto.AWS.SageMaker.Edge.SharedMemoryHandle.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.AWS.SageMaker.Edge.Tensor}
 */
proto.AWS.SageMaker.Edge.Tensor.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.AWS.SageMaker.Edge.Tensor;
  return proto.AWS.SageMaker.Edge.Tensor.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.AWS.SageMaker.Edge.Tensor} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.AWS.SageMaker.Edge.Tensor}
 */
proto.AWS.SageMaker.Edge.Tensor.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.AWS.SageMaker.Edge.TensorMetadata;
      reader.readMessage(value,proto.AWS.SageMaker.Edge.TensorMetadata.deserializeBinaryFromReader);
      msg.setTensorMetadata(value);
      break;
    case 4:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setByteData(value);
      break;
    case 5:
      var value = new proto.AWS.SageMaker.Edge.SharedMemoryHandle;
      reader.readMessage(value,proto.AWS.SageMaker.Edge.SharedMemoryHandle.deserializeBinaryFromReader);
      msg.setSharedMemoryHandle(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.AWS.SageMaker.Edge.Tensor.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.AWS.SageMaker.Edge.Tensor} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.AWS.SageMaker.Edge.Tensor.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTensorMetadata();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.AWS.SageMaker.Edge.TensorMetadata.serializeBinaryToWriter
    );
  }
  f = /** @type {!(string|Uint8Array)} */ (jspb.Message.getField(message, 4));
  if (f != null) {
    writer.writeBytes(
      4,
      f
    );
  }
  f = message.getSharedMemoryHandle();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.AWS.SageMaker.Edge.SharedMemoryHandle.serializeBinaryToWriter
    );
  }
};


/**
 * optional TensorMetadata tensor_metadata = 1;
 * @return {?proto.AWS.SageMaker.Edge.TensorMetadata}
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.getTensorMetadata = function() {
  return /** @type{?proto.AWS.SageMaker.Edge.TensorMetadata} */ (
    jspb.Message.getWrapperField(this, proto.AWS.SageMaker.Edge.TensorMetadata, 1));
};


/**
 * @param {?proto.AWS.SageMaker.Edge.TensorMetadata|undefined} value
 * @return {!proto.AWS.SageMaker.Edge.Tensor} returns this
*/
proto.AWS.SageMaker.Edge.Tensor.prototype.setTensorMetadata = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.AWS.SageMaker.Edge.Tensor} returns this
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.clearTensorMetadata = function() {
  return this.setTensorMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.hasTensorMetadata = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional bytes byte_data = 4;
 * @return {!(string|Uint8Array)}
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.getByteData = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * optional bytes byte_data = 4;
 * This is a type-conversion wrapper around `getByteData()`
 * @return {string}
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.getByteData_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getByteData()));
};


/**
 * optional bytes byte_data = 4;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getByteData()`
 * @return {!Uint8Array}
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.getByteData_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getByteData()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.AWS.SageMaker.Edge.Tensor} returns this
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.setByteData = function(value) {
  return jspb.Message.setOneofField(this, 4, proto.AWS.SageMaker.Edge.Tensor.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.AWS.SageMaker.Edge.Tensor} returns this
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.clearByteData = function() {
  return jspb.Message.setOneofField(this, 4, proto.AWS.SageMaker.Edge.Tensor.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.hasByteData = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional SharedMemoryHandle shared_memory_handle = 5;
 * @return {?proto.AWS.SageMaker.Edge.SharedMemoryHandle}
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.getSharedMemoryHandle = function() {
  return /** @type{?proto.AWS.SageMaker.Edge.SharedMemoryHandle} */ (
    jspb.Message.getWrapperField(this, proto.AWS.SageMaker.Edge.SharedMemoryHandle, 5));
};


/**
 * @param {?proto.AWS.SageMaker.Edge.SharedMemoryHandle|undefined} value
 * @return {!proto.AWS.SageMaker.Edge.Tensor} returns this
*/
proto.AWS.SageMaker.Edge.Tensor.prototype.setSharedMemoryHandle = function(value) {
  return jspb.Message.setOneofWrapperField(this, 5, proto.AWS.SageMaker.Edge.Tensor.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.AWS.SageMaker.Edge.Tensor} returns this
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.clearSharedMemoryHandle = function() {
  return this.setSharedMemoryHandle(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.AWS.SageMaker.Edge.Tensor.prototype.hasSharedMemoryHandle = function() {
  return jspb.Message.getField(this, 5) != null;
};


