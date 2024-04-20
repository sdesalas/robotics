#include <InfluxDbClient.h>

#define TELEMETRY_CONN_MAX_WAIT (10*SECOND)
#define TELEMETRY_BATCH_SIZE 3
#define TELEMETRY_BUFFER_SIZE 6

InfluxDBClient *influxDbClient = NULL;
Ticker sendTelemetry;

void Telemetry_init() {
  Serial.println("Telemetry_init()");
  if (influxDbClient != NULL) {
    delete influxDbClient;
    influxDbClient = NULL;
  }
  if (setting_telemetry_frequency > 0 && setting_telemetry_url.length() > 0 && setting_telemetry_bucket.length() > 0 && setting_telemetry_ssid.length() > 0) {
    Serial.println("New influxdb client.");
    influxDbClient = new InfluxDBClient(setting_telemetry_url, setting_telemetry_org, setting_telemetry_bucket, setting_telemetry_token);
    influxDbClient->setInsecure();
    influxDbClient->setWriteOptions(WriteOptions().batchSize(TELEMETRY_BATCH_SIZE).bufferSize(TELEMETRY_BUFFER_SIZE));
    sendTelemetry.detach();
    sendTelemetry.attach_ms_scheduled(setting_telemetry_frequency * MINUTE, Telemetry_check);
  }
}

bool telemetry_sending = false;
void Telemetry_check() {
  Serial.println("Telemetry_check()");
  if (WiFi.softAPgetStationNum() > 0) {
    Serial.println("Wifi client detected. Skipping telemetry..");
    return;
  }
  if (telemetry_sending) {
    Serial.println("Already sending. Skipping to avoid doubling up.");
    return;
  }
  if (setting_telemetry_frequency == 0 || setting_telemetry_url.length() == 0) {
      sendTelemetry.detach();
      return;
  }
  if (influxDbClient != NULL && setting_telemetry_ssid.length() > 0) {
    telemetry_sending = true;
    boolean connected = Telemetry_connect();
    if (connected) {
      Serial.println("Sending telemetry...");
      boolean success = Telemetry_send();
      Serial.println(success ? "Success!" : "Unable to send!");
      GPIO_blink(GPIO_RED_LED, 10, 100);
      Serial.println("Disconnecting..");
      WiFi.disconnect(true);
    }
    // Finished
    Serial.println("Finished sending telemetry.");
    telemetry_sending = false;
  }
}

boolean Telemetry_connect() {
  Serial.printf("Connecting to Wifi on [%s] (using %s)", setting_telemetry_ssid.c_str(), setting_telemetry_password.c_str());
  WiFi.begin(setting_telemetry_ssid.c_str(), setting_telemetry_password.c_str());
  unsigned long start = millis(); 
  bool blink = 0;
  while (WiFi.status() != WL_CONNECTED) {
    blink = !blink;
    digitalWrite(GPIO_RED_LED, blink);
    delay(200); Serial.print(".");
    if (millis() - start > TELEMETRY_CONN_MAX_WAIT) {
      Serial.printf("Unable to connect over %d seconds.", TELEMETRY_CONN_MAX_WAIT);
      break;
    }
  }
  digitalWrite(GPIO_RED_LED, 0);
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Connected! IP address is: ");
    Serial.println(WiFi.localIP());
    return true;
  }
  return false;
}

boolean Telemetry_send() {
  Point fan_outside("temperature");
  fan_outside.addTag("source", "fan_outside");
  fan_outside.addField("value", 12.0f + random(0, 3));
  influxDbClient->writePoint(fan_outside);
  Point fan_inside("temperature");
  fan_inside.addTag("source", "fan_inside");
  fan_inside.addField("value", 21.0f + random(0, 1));
  influxDbClient->writePoint(fan_inside);
  Point fan_on("temperature");
  fan_on.addTag("source", "fan_on");
  fan_on.addField("value", 0.0f + random(0, 1));
  influxDbClient->writePoint(fan_on);
  return influxDbClient->flushBuffer();
}
