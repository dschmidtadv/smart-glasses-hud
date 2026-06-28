import mqtt from 'mqtt'; // Resolved to browser ESM build via vite.config.ts alias

export interface NavigationData {
  direction?: string;
  distance?: string;
  street?: string;
  speed?: string;
  speedLimit?: number;
}

export type MQTTDataCallback = (data: NavigationData) => void;
export type MQTTStateCallback = (connected: boolean) => void;

const BROKER_URL: string =
  import.meta.env.VITE_MQTT_BROKER_URL || 'wss://test.mosquitto.org:8081';
const TOPIC: string =
  import.meta.env.VITE_MQTT_TOPIC || 'smart-glasses-hud/dietrich/nav-v1';

const RECONNECT_PERIOD_MS = 5000;

class MQTTClient {
  private client: mqtt.MqttClient | null = null;
  private dataCallbacks: Set<MQTTDataCallback> = new Set();
  private stateCallbacks: Set<MQTTStateCallback> = new Set();

  public connect() {
    if (this.client) return;

    console.log(`Connecting to MQTT Broker: ${BROKER_URL}...`);
    this.client = mqtt.connect(BROKER_URL, {
      protocol: 'wss',
      reconnectPeriod: RECONNECT_PERIOD_MS,
    });

    this.client.on('connect', () => {
      console.log('MQTT Connected successfully!');
      this.notifyState(true);

      this.client?.subscribe(TOPIC, (err) => {
        if (!err) {
          console.log(`Subscribed to topic: ${TOPIC}`);
        } else {
          console.error('MQTT Subscription error:', err);
        }
      });
    });

    this.client.on('message', (topic, message) => {
      if (topic === TOPIC) {
        try {
          const payloadStr = message.toString();
          console.log(`[MQTT] Received on ${topic}:`, payloadStr);
          const data: NavigationData = JSON.parse(payloadStr) as NavigationData;
          this.notifyData(data);
        } catch (e) {
          console.error('Failed to parse MQTT message:', e);
        }
      }
    });

    this.client.on('error', (err) => {
      console.error('MQTT Error:', err);
      this.notifyState(false);
    });

    this.client.on('close', () => {
      console.log('MQTT Connection closed. Reconnecting...');
      this.notifyState(false);
    });

    this.client.on('reconnect', () => {
      console.log('MQTT Reconnecting...');
    });
  }

  public disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
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
