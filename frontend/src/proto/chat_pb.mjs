// ESM wrapper for chat_pb.js (CommonJS generated file)
import * as jspb from 'google-protobuf';

/**
 * Empty message
 */
export class Empty extends jspb.Message {
  constructor(opt_data) {
    super();
    jspb.Message.initialize(this, opt_data, 0, -1, null, null);
  }

  static deserializeBinary(bytes) {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new Empty();
    return Empty.deserializeBinaryFromReader(msg, reader);
  }

  static deserializeBinaryFromReader(msg, reader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break;
      reader.skipField();
    }
    return msg;
  }

  serializeBinary() {
    const writer = new jspb.BinaryWriter();
    Empty.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static serializeBinaryToWriter(message, writer) {}
}

/**
 * User message
 */
export class User extends jspb.Message {
  constructor(opt_data) {
    super();
    jspb.Message.initialize(this, opt_data, 0, -1, null, null);
  }

  static deserializeBinary(bytes) {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new User();
    return User.deserializeBinaryFromReader(msg, reader);
  }

  static deserializeBinaryFromReader(msg, reader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break;
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          msg.setId(reader.readString());
          break;
        case 2:
          msg.setName(reader.readString());
          break;
        case 3:
          msg.setIsOnline(reader.readBool());
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  serializeBinary() {
    const writer = new jspb.BinaryWriter();
    User.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static serializeBinaryToWriter(message, writer) {
    const id = message.getId();
    if (id.length > 0) writer.writeString(1, id);
    const name = message.getName();
    if (name.length > 0) writer.writeString(2, name);
    const isOnline = message.getIsOnline();
    if (isOnline) writer.writeBool(3, isOnline);
  }

  getId() { return jspb.Message.getFieldWithDefault(this, 1, ''); }
  setId(value) { return jspb.Message.setProto3StringField(this, 1, value); }
  getName() { return jspb.Message.getFieldWithDefault(this, 2, ''); }
  setName(value) { return jspb.Message.setProto3StringField(this, 2, value); }
  getIsOnline() { return jspb.Message.getBooleanFieldWithDefault(this, 3, false); }
  setIsOnline(value) { return jspb.Message.setProto3BooleanField(this, 3, value); }
}

/**
 * UserList message
 */
export class UserList extends jspb.Message {
  constructor(opt_data) {
    super();
    jspb.Message.initialize(this, opt_data, 0, -1, [1], null);
  }

  static deserializeBinary(bytes) {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new UserList();
    return UserList.deserializeBinaryFromReader(msg, reader);
  }

  static deserializeBinaryFromReader(msg, reader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break;
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          const user = new User();
          reader.readMessage(user, User.deserializeBinaryFromReader);
          msg.addUsers(user);
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  serializeBinary() {
    const writer = new jspb.BinaryWriter();
    UserList.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static serializeBinaryToWriter(message, writer) {
    const users = message.getUsersList();
    if (users.length > 0) {
      writer.writeRepeatedMessage(1, users, User.serializeBinaryToWriter);
    }
  }

  getUsersList() { return jspb.Message.getRepeatedWrapperField(this, User, 1); }
  setUsersList(value) { return jspb.Message.setRepeatedWrapperField(this, 1, value); }
  addUsers(value, opt_index) { return jspb.Message.addToRepeatedWrapperField(this, 1, value, User, opt_index); }
  clearUsersList() { return this.setUsersList([]); }
}

/**
 * AuthRequest message
 */
export class AuthRequest extends jspb.Message {
  constructor(opt_data) {
    super();
    jspb.Message.initialize(this, opt_data, 0, -1, null, null);
  }

  static deserializeBinary(bytes) {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new AuthRequest();
    return AuthRequest.deserializeBinaryFromReader(msg, reader);
  }

  static deserializeBinaryFromReader(msg, reader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break;
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          msg.setClientId(reader.readString());
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  serializeBinary() {
    const writer = new jspb.BinaryWriter();
    AuthRequest.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static serializeBinaryToWriter(message, writer) {
    const clientId = message.getClientId();
    if (clientId.length > 0) writer.writeString(1, clientId);
  }

  getClientId() { return jspb.Message.getFieldWithDefault(this, 1, ''); }
  setClientId(value) { return jspb.Message.setProto3StringField(this, 1, value); }
}

/**
 * ClientMessage - message sent from client
 */
export class ClientMessage extends jspb.Message {
  constructor(opt_data) {
    super();
    jspb.Message.initialize(this, opt_data, 0, -1, null, null);
  }

  static deserializeBinary(bytes) {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new ClientMessage();
    return ClientMessage.deserializeBinaryFromReader(msg, reader);
  }

  static deserializeBinaryFromReader(msg, reader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break;
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          msg.setText(reader.readString());
          break;
        case 2:
          msg.setRecipientId(reader.readString());
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  serializeBinary() {
    const writer = new jspb.BinaryWriter();
    ClientMessage.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static serializeBinaryToWriter(message, writer) {
    const text = message.getText();
    if (text.length > 0) writer.writeString(1, text);
    const recipientId = message.getRecipientId();
    if (recipientId.length > 0) writer.writeString(2, recipientId);
  }

  getText() { return jspb.Message.getFieldWithDefault(this, 1, ''); }
  setText(value) { return jspb.Message.setProto3StringField(this, 1, value); }
  getRecipientId() { return jspb.Message.getFieldWithDefault(this, 2, ''); }
  setRecipientId(value) { return jspb.Message.setProto3StringField(this, 2, value); }
}

/**
 * GlobalMessage
 */
export class GlobalMessage extends jspb.Message {
  constructor(opt_data) {
    super();
    jspb.Message.initialize(this, opt_data, 0, -1, null, null);
  }

  static deserializeBinary(bytes) {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new GlobalMessage();
    return GlobalMessage.deserializeBinaryFromReader(msg, reader);
  }

  static deserializeBinaryFromReader(msg, reader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break;
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          msg.setId(reader.readString());
          break;
        case 2:
          const sender = new User();
          reader.readMessage(sender, User.deserializeBinaryFromReader);
          msg.setSender(sender);
          break;
        case 3:
          msg.setText(reader.readString());
          break;
        case 4:
          msg.setTimestamp(reader.readInt64());
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  serializeBinary() {
    const writer = new jspb.BinaryWriter();
    GlobalMessage.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static serializeBinaryToWriter(message, writer) {
    const id = message.getId();
    if (id.length > 0) writer.writeString(1, id);
    const sender = message.getSender();
    if (sender != null) writer.writeMessage(2, sender, User.serializeBinaryToWriter);
    const text = message.getText();
    if (text.length > 0) writer.writeString(3, text);
    const timestamp = message.getTimestamp();
    if (timestamp !== 0) writer.writeInt64(4, timestamp);
  }

  getId() { return jspb.Message.getFieldWithDefault(this, 1, ''); }
  setId(value) { return jspb.Message.setProto3StringField(this, 1, value); }
  getSender() { return jspb.Message.getWrapperField(this, User, 2); }
  setSender(value) { return jspb.Message.setWrapperField(this, 2, value); }
  clearSender() { return this.setSender(undefined); }
  hasSender() { return jspb.Message.getField(this, 2) != null; }
  getText() { return jspb.Message.getFieldWithDefault(this, 3, ''); }
  setText(value) { return jspb.Message.setProto3StringField(this, 3, value); }
  getTimestamp() { return jspb.Message.getFieldWithDefault(this, 4, 0); }
  setTimestamp(value) { return jspb.Message.setProto3IntField(this, 4, value); }
}

/**
 * PrivateMessage
 */
export class PrivateMessage extends jspb.Message {
  constructor(opt_data) {
    super();
    jspb.Message.initialize(this, opt_data, 0, -1, null, null);
  }

  static deserializeBinary(bytes) {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new PrivateMessage();
    return PrivateMessage.deserializeBinaryFromReader(msg, reader);
  }

  static deserializeBinaryFromReader(msg, reader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break;
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          msg.setId(reader.readString());
          break;
        case 2:
          const sender = new User();
          reader.readMessage(sender, User.deserializeBinaryFromReader);
          msg.setSender(sender);
          break;
        case 3:
          const recipient = new User();
          reader.readMessage(recipient, User.deserializeBinaryFromReader);
          msg.setRecipient(recipient);
          break;
        case 4:
          msg.setText(reader.readString());
          break;
        case 5:
          msg.setTimestamp(reader.readInt64());
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  serializeBinary() {
    const writer = new jspb.BinaryWriter();
    PrivateMessage.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static serializeBinaryToWriter(message, writer) {
    const id = message.getId();
    if (id.length > 0) writer.writeString(1, id);
    const sender = message.getSender();
    if (sender != null) writer.writeMessage(2, sender, User.serializeBinaryToWriter);
    const recipient = message.getRecipient();
    if (recipient != null) writer.writeMessage(3, recipient, User.serializeBinaryToWriter);
    const text = message.getText();
    if (text.length > 0) writer.writeString(4, text);
    const timestamp = message.getTimestamp();
    if (timestamp !== 0) writer.writeInt64(5, timestamp);
  }

  getId() { return jspb.Message.getFieldWithDefault(this, 1, ''); }
  setId(value) { return jspb.Message.setProto3StringField(this, 1, value); }
  getSender() { return jspb.Message.getWrapperField(this, User, 2); }
  setSender(value) { return jspb.Message.setWrapperField(this, 2, value); }
  clearSender() { return this.setSender(undefined); }
  hasSender() { return jspb.Message.getField(this, 2) != null; }
  getRecipient() { return jspb.Message.getWrapperField(this, User, 3); }
  setRecipient(value) { return jspb.Message.setWrapperField(this, 3, value); }
  clearRecipient() { return this.setRecipient(undefined); }
  hasRecipient() { return jspb.Message.getField(this, 3) != null; }
  getText() { return jspb.Message.getFieldWithDefault(this, 4, ''); }
  setText(value) { return jspb.Message.setProto3StringField(this, 4, value); }
  getTimestamp() { return jspb.Message.getFieldWithDefault(this, 5, 0); }
  setTimestamp(value) { return jspb.Message.setProto3IntField(this, 5, value); }
}

/**
 * UserPresenceUpdate
 */
export class UserPresenceUpdate extends jspb.Message {
  constructor(opt_data) {
    super();
    jspb.Message.initialize(this, opt_data, 0, -1, null, null);
  }

  static deserializeBinary(bytes) {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new UserPresenceUpdate();
    return UserPresenceUpdate.deserializeBinaryFromReader(msg, reader);
  }

  static deserializeBinaryFromReader(msg, reader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break;
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          const user = new User();
          reader.readMessage(user, User.deserializeBinaryFromReader);
          msg.setUser(user);
          break;
        case 2:
          msg.setIsOnline(reader.readBool());
          break;
        case 3:
          msg.setTimestamp(reader.readInt64());
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  serializeBinary() {
    const writer = new jspb.BinaryWriter();
    UserPresenceUpdate.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static serializeBinaryToWriter(message, writer) {
    const user = message.getUser();
    if (user != null) writer.writeMessage(1, user, User.serializeBinaryToWriter);
    const isOnline = message.getIsOnline();
    if (isOnline) writer.writeBool(2, isOnline);
    const timestamp = message.getTimestamp();
    if (timestamp !== 0) writer.writeInt64(3, timestamp);
  }

  getUser() { return jspb.Message.getWrapperField(this, User, 1); }
  setUser(value) { return jspb.Message.setWrapperField(this, 1, value); }
  clearUser() { return this.setUser(undefined); }
  hasUser() { return jspb.Message.getField(this, 1) != null; }
  getIsOnline() { return jspb.Message.getBooleanFieldWithDefault(this, 2, false); }
  setIsOnline(value) { return jspb.Message.setProto3BooleanField(this, 2, value); }
  getTimestamp() { return jspb.Message.getFieldWithDefault(this, 3, 0); }
  setTimestamp(value) { return jspb.Message.setProto3IntField(this, 3, value); }
}

/**
 * TypingEvent
 */
export class TypingEvent extends jspb.Message {
  constructor(opt_data) {
    super();
    jspb.Message.initialize(this, opt_data, 0, -1, null, null);
  }

  static deserializeBinary(bytes) {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new TypingEvent();
    return TypingEvent.deserializeBinaryFromReader(msg, reader);
  }

  static deserializeBinaryFromReader(msg, reader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break;
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          const user = new User();
          reader.readMessage(user, User.deserializeBinaryFromReader);
          msg.setUser(user);
          break;
        case 2:
          msg.setContextId(reader.readString());
          break;
        case 3:
          msg.setIsTyping(reader.readBool());
          break;
        case 4:
          msg.setTimestamp(reader.readInt64());
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  serializeBinary() {
    const writer = new jspb.BinaryWriter();
    TypingEvent.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static serializeBinaryToWriter(message, writer) {
    const user = message.getUser();
    if (user != null) writer.writeMessage(1, user, User.serializeBinaryToWriter);
    const contextId = message.getContextId();
    if (contextId.length > 0) writer.writeString(2, contextId);
    const isTyping = message.getIsTyping();
    if (isTyping) writer.writeBool(3, isTyping);
    const timestamp = message.getTimestamp();
    if (timestamp !== 0) writer.writeInt64(4, timestamp);
  }

  getUser() { return jspb.Message.getWrapperField(this, User, 1); }
  setUser(value) { return jspb.Message.setWrapperField(this, 1, value); }
  clearUser() { return this.setUser(undefined); }
  hasUser() { return jspb.Message.getField(this, 1) != null; }
  getContextId() { return jspb.Message.getFieldWithDefault(this, 2, ''); }
  setContextId(value) { return jspb.Message.setProto3StringField(this, 2, value); }
  getIsTyping() { return jspb.Message.getBooleanFieldWithDefault(this, 3, false); }
  setIsTyping(value) { return jspb.Message.setProto3BooleanField(this, 3, value); }
  getTimestamp() { return jspb.Message.getFieldWithDefault(this, 4, 0); }
  setTimestamp(value) { return jspb.Message.setProto3IntField(this, 4, value); }
}

/**
 * ServerMessage - wrapper for all server events (uses oneof)
 */
export class ServerMessage extends jspb.Message {
  constructor(opt_data) {
    super();
    jspb.Message.initialize(this, opt_data, 0, -1, null, [[1, 2, 3, 4, 5]]);
  }

  static deserializeBinary(bytes) {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new ServerMessage();
    return ServerMessage.deserializeBinaryFromReader(msg, reader);
  }

  static deserializeBinaryFromReader(msg, reader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break;
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          const globalMsg = new GlobalMessage();
          reader.readMessage(globalMsg, GlobalMessage.deserializeBinaryFromReader);
          msg.setGlobalMessage(globalMsg);
          break;
        case 2:
          const privateMsg = new PrivateMessage();
          reader.readMessage(privateMsg, PrivateMessage.deserializeBinaryFromReader);
          msg.setPrivateMessage(privateMsg);
          break;
        case 3:
          const presence = new UserPresenceUpdate();
          reader.readMessage(presence, UserPresenceUpdate.deserializeBinaryFromReader);
          msg.setPresenceUpdate(presence);
          break;
        case 4:
          const typing = new TypingEvent();
          reader.readMessage(typing, TypingEvent.deserializeBinaryFromReader);
          msg.setTypingEvent(typing);
          break;
        case 5:
          const userList = new UserList();
          reader.readMessage(userList, UserList.deserializeBinaryFromReader);
          msg.setUserList(userList);
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  serializeBinary() {
    const writer = new jspb.BinaryWriter();
    ServerMessage.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static serializeBinaryToWriter(message, writer) {
    const globalMsg = message.getGlobalMessage();
    if (globalMsg != null) writer.writeMessage(1, globalMsg, GlobalMessage.serializeBinaryToWriter);
    const privateMsg = message.getPrivateMessage();
    if (privateMsg != null) writer.writeMessage(2, privateMsg, PrivateMessage.serializeBinaryToWriter);
    const presence = message.getPresenceUpdate();
    if (presence != null) writer.writeMessage(3, presence, UserPresenceUpdate.serializeBinaryToWriter);
    const typing = message.getTypingEvent();
    if (typing != null) writer.writeMessage(4, typing, TypingEvent.serializeBinaryToWriter);
    const userList = message.getUserList();
    if (userList != null) writer.writeMessage(5, userList, UserList.serializeBinaryToWriter);
  }

  getGlobalMessage() { return jspb.Message.getWrapperField(this, GlobalMessage, 1); }
  setGlobalMessage(value) { return jspb.Message.setOneofWrapperField(this, 1, [1, 2, 3, 4, 5], value); }
  clearGlobalMessage() { return this.setGlobalMessage(undefined); }
  hasGlobalMessage() { return jspb.Message.getField(this, 1) != null; }
  
  getPrivateMessage() { return jspb.Message.getWrapperField(this, PrivateMessage, 2); }
  setPrivateMessage(value) { return jspb.Message.setOneofWrapperField(this, 2, [1, 2, 3, 4, 5], value); }
  clearPrivateMessage() { return this.setPrivateMessage(undefined); }
  hasPrivateMessage() { return jspb.Message.getField(this, 2) != null; }
  
  getPresenceUpdate() { return jspb.Message.getWrapperField(this, UserPresenceUpdate, 3); }
  setPresenceUpdate(value) { return jspb.Message.setOneofWrapperField(this, 3, [1, 2, 3, 4, 5], value); }
  clearPresenceUpdate() { return this.setPresenceUpdate(undefined); }
  hasPresenceUpdate() { return jspb.Message.getField(this, 3) != null; }
  
  getTypingEvent() { return jspb.Message.getWrapperField(this, TypingEvent, 4); }
  setTypingEvent(value) { return jspb.Message.setOneofWrapperField(this, 4, [1, 2, 3, 4, 5], value); }
  clearTypingEvent() { return this.setTypingEvent(undefined); }
  hasTypingEvent() { return jspb.Message.getField(this, 4) != null; }
  
  getUserList() { return jspb.Message.getWrapperField(this, UserList, 5); }
  setUserList(value) { return jspb.Message.setOneofWrapperField(this, 5, [1, 2, 3, 4, 5], value); }
  clearUserList() { return this.setUserList(undefined); }
  hasUserList() { return jspb.Message.getField(this, 5) != null; }

  getPayloadCase() {
    if (this.hasGlobalMessage()) return 1;
    if (this.hasPrivateMessage()) return 2;
    if (this.hasPresenceUpdate()) return 3;
    if (this.hasTypingEvent()) return 4;
    if (this.hasUserList()) return 5;
    return 0;
  }
}

// Enum for payload case
ServerMessage.PayloadCase = {
  PAYLOAD_NOT_SET: 0,
  GLOBAL_MESSAGE: 1,
  PRIVATE_MESSAGE: 2,
  PRESENCE_UPDATE: 3,
  TYPING_EVENT: 4,
  USER_LIST: 5
};

/**
 * SendMessageResponse
 */
export class SendMessageResponse extends jspb.Message {
  constructor(opt_data) {
    super();
    jspb.Message.initialize(this, opt_data, 0, -1, null, null);
  }

  static deserializeBinary(bytes) {
    const reader = new jspb.BinaryReader(bytes);
    const msg = new SendMessageResponse();
    return SendMessageResponse.deserializeBinaryFromReader(msg, reader);
  }

  static deserializeBinaryFromReader(msg, reader) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break;
      const field = reader.getFieldNumber();
      switch (field) {
        case 1:
          msg.setSuccess(reader.readBool());
          break;
        case 2:
          msg.setMessageId(reader.readString());
          break;
        default:
          reader.skipField();
          break;
      }
    }
    return msg;
  }

  serializeBinary() {
    const writer = new jspb.BinaryWriter();
    SendMessageResponse.serializeBinaryToWriter(this, writer);
    return writer.getResultBuffer();
  }

  static serializeBinaryToWriter(message, writer) {
    const success = message.getSuccess();
    if (success) writer.writeBool(1, success);
    const messageId = message.getMessageId();
    if (messageId.length > 0) writer.writeString(2, messageId);
  }

  getSuccess() { return jspb.Message.getBooleanFieldWithDefault(this, 1, false); }
  setSuccess(value) { return jspb.Message.setProto3BooleanField(this, 1, value); }
  getMessageId() { return jspb.Message.getFieldWithDefault(this, 2, ''); }
  setMessageId(value) { return jspb.Message.setProto3StringField(this, 2, value); }
}
