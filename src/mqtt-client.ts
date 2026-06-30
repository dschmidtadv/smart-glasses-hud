// @ts-nocheck
export interface NavigationData {
  direction?: string;
  distance?: string;
  street?: string;
  speed?: string;
  action?: string;
}

export type MQTTDataCallback = (data: NavigationData) => void;
export type MQTTStateCallback = (connected: boolean) => void;

class MQTTClient {
  private socket: WebSocket | null = null;
  private TOPIC_URL = '';

  private dataCallbacks: Set<MQTTDataCallback> = new Set();
  private stateCallbacks: Set<MQTTStateCallback> = new Set();

  public connect() {
    if (this.socket) return;

    // Extract secure topic from URL hash (e.g., #topic=a4b9c8...)
    let topic = 'smart-glasses-hud-dietrich-v2'; // fallback legacy topic
    const hashMatches = window.location.hash.match(/topic=([^&]+)/);
    if (hashMatches && hashMatches[1]) {
      topic = hashMatches[1];
    }
    
    this.TOPIC_URL = `wss://ntfy.sh/${topic}/ws`;

    console.log(`Connecting to Ntfy WebSocket: ${this.TOPIC_URL}...`);
    this.socket = new WebSocket(this.TOPIC_URL);

    this.socket.onopen = () => {
      console.log('Ntfy WebSocket Connected successfully!');
      this.notifyState(true);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'message') {
          console.log(`[Ntfy WS] Received:`, data.message);
          const navData: NavigationData = JSON.parse(data.message);
          this.notifyData(navData);
        }
      } catch (e) {
        console.error('Failed to parse Ntfy WS message:', e);
      }
    };

    this.socket.onerror = (err) => {
      console.error('Ntfy WS Error:', err);
    };

    this.socket.onclose = () => {
      console.log('Ntfy WS Closed. Reconnecting in 3s...');
      this.notifyState(false);
      this.socket = null;
      setTimeout(() => this.connect(), 3000);
    };
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.notifyState(false);
    }
  }

  public onData(callback: MQTTDataCallback) {
    this.dataCallbacks.add(callback);
  }

  public onStateChange(callback: MQTTStateCallback) {
    this.stateCallbacks.add(callback);
  }

  private notifyData(data: NavigationData) {
    this.dataCallbacks.forEach(cb => cb(data));
  }

  private notifyState(connected: boolean) {
    this.stateCallbacks.forEach(cb => cb(connected));
  }
}

export const mqttClient = new MQTTClient();
