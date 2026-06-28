// @ts-nocheck
import * as mqtt from 'mqtt/dist/mqtt'; // Use browser build

export interface NavigationData {
  direction?: string;
  distance?: string;
  street?: string;
  speed?: string;
}

export type MQTTDataCallback = (data: NavigationData) => void;
export type MQTTStateCallback = (connected: boolean) => void;

class MQTTClient {
  private client: mqtt.MqttClient | null = null;
  // A randomized unique topic so no one else intercepts the testing data
  private readonly TOPIC = 'smart-glasses-hud/dietrich/nav-v1';
  private readonly BROKER_URL = 'wss://test.mosquitto.org:8081';

  private dataCallbacks: Set<MQTTDataCallback> = new Set();
  private stateCallbacks: Set<MQTTStateCallback> = new Set();

  public connect() {
    if (this.client) return;

    console.log(`Connecting to MQTT Broker: ${this.BROKER_URL}...`);
    this.client = mqtt.connect(this.BROKER_URL, {
      protocol: 'wss'
    });

    this.client.on('connect', () => {
      console.log('MQTT Connected successfully!');
      this.notifyState(true);
      
      this.client?.subscribe(this.TOPIC, (err) => {
        if (!err) {
          console.log(`Subscribed to topic: ${this.TOPIC}`);
        } else {
          console.error('MQTT Subscription error:', err);
        }
      });
    });

    this.client.on('message', (topic, message) => {
      if (topic === this.TOPIC) {
        try {
          const payloadStr = message.toString();
          console.log(`[MQTT] Received on ${topic}:`, payloadStr);
          const data: NavigationData = JSON.parse(payloadStr);
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
      console.log('MQTT Connection closed');
      this.notifyState(false);
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
