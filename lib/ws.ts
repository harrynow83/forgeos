"use client";

interface WebSocketMessage {
  type: 'status_update' | 'printer_update' | 'error' | 'connection_status';
  data?: any;
  timestamp?: number;
}

interface WebSocketClient {
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
  send: (message: WebSocketMessage) => void;
  onMessage: (callback: (message: WebSocketMessage) => void) => void;
  onConnectionChange: (callback: (connected: boolean) => void) => void;
  onNetworkChange: (callback: (online: boolean) => void) => void;
}

class WebSocketManager implements WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isConnecting = false;
  private shouldReconnect = true;
  private messageCallbacks: ((message: WebSocketMessage) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private networkCallbacks: ((online: boolean) => void)[] = [];
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private networkCleanup: (() => void) | null = null;

  constructor(private url: string = 'ws://localhost:3001/ws') {
    // Auto-connect on client-side only
    if (typeof window !== 'undefined') {
      this.setupNetworkListeners();
      this.connect();
    }
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('Network connection restored');
      this.notifyNetworkChange(true);
      // Attempt to reconnect when coming back online
      if (!this.isConnected()) {
        this.connect();
      }
    };

    const handleOffline = () => {
      console.log('Network connection lost');
      this.notifyNetworkChange(false);
      // Close WebSocket when going offline
      if (this.ws) {
        this.ws.close();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Store listeners for cleanup
    this.networkCleanup = () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  connect() {
    if (typeof window === 'undefined' || this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // Check if we're online before attempting to connect
    if (!navigator.onLine) {
      console.log('Device is offline, skipping WebSocket connection');
      return;
    }

    this.isConnecting = true;
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionChange(true);
        
        // Send initial connection message
        this.send({ type: 'connection_status', data: { connected: true } });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.notifyMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.notifyConnectionChange(false);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  send(message: WebSocketMessage) {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  onMessage(callback: (message: WebSocketMessage) => void) {
    this.messageCallbacks.push(callback);
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
    // Notify current state immediately
    callback(this.isConnected());
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff: 1s → 2s → 5s → 10s → max 30s
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeoutId = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private notifyMessage(message: WebSocketMessage) {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message callback:', error);
      }
    });
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  private notifyNetworkChange(online: boolean) {
    this.networkCallbacks.forEach(callback => {
      try {
        callback(online);
      } catch (error) {
        console.error('Error in network callback:', error);
      }
    });
  }

  onNetworkChange(callback: (online: boolean) => void) {
    this.networkCallbacks.push(callback);
    // Notify current state immediately
    if (typeof window !== 'undefined') {
      callback(navigator.onLine);
    }
  }
}

// Singleton instance
let wsInstance: WebSocketManager | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!wsInstance) {
    wsInstance = new WebSocketManager();
  }
  return wsInstance;
}

export type { WebSocketMessage, WebSocketClient };
