import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL =
  import.meta.env.VITE_WS_URL || `${window.location.origin}/ws-orders`;

export function subscribeToTopic(topic, onMessage, onError, onConnect) {
  const client = new Client({
    reconnectDelay: 3000,
    webSocketFactory: () => new SockJS(WS_URL),
    onConnect: () => {
      onConnect?.();
      client.subscribe(topic, (message) => {
        try {
          onMessage(JSON.parse(message.body));
        } catch (error) {
          onError?.(error);
        }
      });
    },
    onStompError: (frame) => {
      onError?.(new Error(frame.headers.message || "WebSocket error"));
    },
    onWebSocketError: (event) => {
      onError?.(new Error(event?.message || "Connection error"));
    },
  });

  client.activate();

  return () => {
    client.deactivate();
  };
}
