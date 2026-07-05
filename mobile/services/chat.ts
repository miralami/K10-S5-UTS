import { API_BASE_URL } from "../constants/config";

type MessageHandler = (msg: any) => void;

class ChatService {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private userId: string | null = null;
  private userName: string | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private reconnectAttempts = 0;
  private maxReconnect = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(token: string, userId: string, userName: string) {
    this.token = token;
    this.userId = userId;
    this.userName = userName;
    this.reconnectAttempts = 0;
    this._open();
  }

  private _open() {
    if (this.ws) this._cleanup();

    const url = API_BASE_URL.replace("http", "ws").replace("8000", "8080");
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this._send({
        type: "auth",
        userId: this.userId,
        userName: this.userName,
        token: this.token,
      });
    };

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        this._emit(msg.type, msg);
      } catch { /* ignore malformed */ }
    };

    this.ws.onerror = () => {};

    this.ws.onclose = () => {
      this._reconnect();
    };
  }

  private _reconnect() {
    if (this.reconnectAttempts >= this.maxReconnect) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this._open(), delay);
  }

  sendMessage(text: string, recipientId?: string) {
    const msg: any = {
      type: recipientId ? "private_message" : "message",
      id: Date.now().toString(),
      text,
    };
    if (recipientId) msg.recipientId = recipientId;
    this._send(msg);
  }

  sendTyping(isTyping: boolean, contextId = "global") {
    this._send({ type: "typing", contextId, isTyping });
  }

  requestUsers() {
    this._send({ type: "get_users" });
  }

  on(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.token = null;
    this._cleanup();
  }

  private _cleanup() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  private _send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private _emit(event: string, data: any) {
    this.handlers.get(event)?.forEach((h) => h(data));
  }
}

export const chatService = new ChatService();
