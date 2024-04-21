#include <InfluxDbClient.h>

#define TELEMETRY_CONN_MAX_WAIT (10*SECOND)
#define TELEMETRY_BATCH_SIZE 4
#define TELEMETRY_BUFFER_SIZE 8
#define TELEMETRY_MEASUREMENT "climate_control"

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
  Point p1(TELEMETRY_MEASUREMENT);
  p1.addTag("source", "metric.inside");
  p1.addField("value", metric.inside);
  influxDbClient->writePoint(p1);
  Point p2(TELEMETRY_MEASUREMENT);
  p2.addTag("source", "metric.outside");
  p2.addField("value", metric.outside);
  influxDbClient->writePoint(p2);
  Point p3(TELEMETRY_MEASUREMENT);
  p3.addTag("source", "metric.fan");
  p3.addField("value", metric.fan);
  influxDbClient->writePoint(p3);
  Point p4(TELEMETRY_MEASUREMENT);
  p4.addTag("source", "metric.count");
  p4.addField("value", metric.count);
  influxDbClient->writePoint(p4);
  return influxDbClient->flushBuffer();
}
