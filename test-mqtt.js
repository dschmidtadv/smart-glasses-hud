const mqtt = require('mqtt');
console.log('Testing mosquitto...');
const client1 = mqtt.connect('wss://test.mosquitto.org:8081');
client1.on('connect', () => { console.log('Mosquitto Connected!'); client1.end(); });
client1.on('error', (e) => { console.log('Mosquitto Error', e.message); });

console.log('Testing emqx...');
const client2 = mqtt.connect('wss://broker.emqx.io:8084/mqtt');
client2.on('connect', () => { console.log('EMQX Connected!'); client2.end(); });
client2.on('error', (e) => { console.log('EMQX Error', e.message); });
