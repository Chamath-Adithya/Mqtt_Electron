const mqtt = require('mqtt');

// MQTT server details
const mqttServerUrl = 'mqtts://ee056c8dd35140d9a73f29e4ed68361f.s1.eu.hivemq.cloud';
const mqttPort = 8883;
const username = 'admin';
const password = 'Admin@123';

// Topics
const switchTopic = 'switch/topic'; // Replace with your topic for switches
const pleasureTopic = 'pleasure/topic'; // Replace with your topic for pleasure values

// Create an MQTT client instance
const client = mqtt.connect(mqttServerUrl, {
    port: mqttPort,
    username: username,
    password: password,
    protocol: 'mqtts',
});

client.on('connect', () => {
    console.log('Connected to MQTT broker');

    // Subscribe to pleasure topic
    client.subscribe(pleasureTopic, (err) => {
        if (err) {
            console.error('Subscribe error:', err);
        } else {
            console.log('Subscribed to topic:', pleasureTopic);
        }
    });

    // Initialize switch states
    updateSwitches();
});

// Handle incoming messages
client.on('message', (topic, message) => {
    if (topic === pleasureTopic) {
        const pleasureValue = message.toString();
        document.getElementById('pleasure-value').textContent = pleasureValue;
    }
});

// Handle switch change events
document.querySelectorAll('#controls-section input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
        const switchNumber = event.target.id.replace('switch', '');
        const switchState = event.target.checked ? 'ON' : 'OFF';
        const message = `${switchNumber}:${switchState}`;
        client.publish(switchTopic, message, (err) => {
            if (err) {
                console.error('Publish error:', err);
            } else {
                console.log('Switch state published:', message);
            }
        });
    });
});

// Function to initialize switch states
function updateSwitches() {
    // This function can be used to initialize switch states from the server if needed
}

