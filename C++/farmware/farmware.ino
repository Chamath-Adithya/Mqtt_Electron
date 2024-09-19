#include <WiFi.h>
#include <WiFiClientSecure.h>  // Include this library for secure WiFi connections
#include <PubSubClient.h>

// WiFi credentials
const char* ssid = "Redmi Note9";       // Replace with your WiFi SSID
const char* password = "12345678";      // Replace with your WiFi password

// MQTT server details
const char* mqtt_server = "ee056c8dd35140d9a73f29e4ed68361f.s1.eu.hivemq.cloud";
const int mqttPort = 8883;              // Port for secure MQTT
const char* mqttUser = "admin";         // Replace with your MQTT username
const char* mqttPassword = "Admin@123"; // Replace with your MQTT password

// MQTT topics
const char* switchTopic = "switch/topic";     // Topic to control switches
const char* pleasureTopic = "pleasure/topic"; // Topic to publish sensor values

// Create a WiFiClientSecure object for the MQTT connection
WiFiClientSecure espClient;
PubSubClient client(espClient);

// GPIO pin definitions for the switches
const int switchPins[] = {19, 18, 5, 17, 16, 4, 2, 15}; // Update these pins as per your setup
const int numSwitches = sizeof(switchPins) / sizeof(switchPins[0]);

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 MQTT Example");

  // Initialize switch pins
  for (int i = 0; i < numSwitches; i++) {
    pinMode(switchPins[i], OUTPUT);
    digitalWrite(switchPins[i], LOW); // Initialize switches to OFF
  }

  setup_wifi();

  // Set MQTT server and callback
  client.setServer(mqtt_server, mqttPort);
  client.setCallback(callback);

  // Allow insecure connection (not recommended for production)
  espClient.setInsecure();

  // Connect to MQTT broker
  reconnect();
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* message, unsigned int length) {
  String receivedTopic = String(topic);
  String receivedMessage;

  // Convert message to string
  for (unsigned int i = 0; i < length; i++) {
    receivedMessage += (char)message[i];
  }

  Serial.print("Received message on topic: ");
  Serial.println(receivedTopic);
  Serial.print("Message: ");
  Serial.println(receivedMessage);

  // Handle messages for switch control
  if (receivedTopic == switchTopic) {
    int colonIndex = receivedMessage.indexOf(':');
    if (colonIndex != -1) {
      // Extract switch number and state
      int switchNumber = receivedMessage.substring(0, colonIndex).toInt();
      String switchState = receivedMessage.substring(colonIndex + 1);

      if (switchNumber >= 1 && switchNumber <= numSwitches) {
        int pinIndex = switchNumber - 1; // Adjust for 0-based index

        if (switchState == "ON") {
          digitalWrite(switchPins[pinIndex], HIGH); // Turn switch ON
          Serial.print("Switch ");
          Serial.print(switchNumber);
          Serial.println(" turned ON");
        } else if (switchState == "OFF") {
          digitalWrite(switchPins[pinIndex], LOW); // Turn switch OFF
          Serial.print("Switch ");
          Serial.print(switchNumber);
          Serial.println(" turned OFF");
        } else {
          Serial.println("Invalid switch state");
        }
      } else {
        Serial.println("Invalid switch number");
      }
    } else {
      Serial.println("Invalid message format");
    }
  }
}

void reconnect() {
  // Loop until reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP32Client", mqttUser, mqttPassword)) {
      Serial.println("connected");
      // Subscribe to topics
      client.subscribe(switchTopic);
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println("; trying again in 2 seconds");
      delay(2000);
    }
  }
}

void publishPleasureValue() {
  // Replace this with actual sensor reading if available
  float pleasureValue = random(0, 100) / 10.0;
  String pleasureMessage = String(pleasureValue, 1);
  client.publish(pleasureTopic, pleasureMessage.c_str());
  Serial.print("Published pleasure value: ");
  Serial.println(pleasureMessage);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Publish sensor data every 5 seconds
  static unsigned long lastPublishTime = 0;
  if (millis() - lastPublishTime > 5000) {
    publishPleasureValue();
    lastPublishTime = millis();
  }
}
