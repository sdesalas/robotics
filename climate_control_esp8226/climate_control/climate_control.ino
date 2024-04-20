#include <Arduino.h>
#include <FS.h>
#include <LittleFS.h>
#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ArduinoJson.h>
#include <Ticker.h>

#define SECOND 1000
#define MINUTE (60 * 1000)

struct Metric { short inside; short outside; byte fan; short count; };

// "fan" options
boolean setting_fan_enabled = false;
int setting_fan_cold = 0;
int setting_fan_hot = 0;
int setting_fan_buffer = 0;
boolean setting_fan_sensorswap = false;
// "wifi" options
String setting_wifi_ssid = "";
String setting_wifi_password = "";
boolean setting_wifi_hidden = false;
// "telemetry" options
int setting_telemetry_frequency = 0;
String setting_telemetry_url = "";
String setting_telemetry_bucket = "";
String setting_telemetry_org = "";
String setting_telemetry_token = "";
String setting_telemetry_ssid = "";
String setting_telemetry_password = "";
// "reboot" options 
boolean setting_reboot_ota = false;

void setup() {
  Board_init();
  GPIO_init();
  GPIO_blink(10, 200);
  FS_init();
  delay(500);
  Settings_init();
  Metrics_init();
  Telemetry_init();
  Wifi_init();
  WebServer_init();
  GPIO_blink(10, 100);
}

void loop() {
  
}
