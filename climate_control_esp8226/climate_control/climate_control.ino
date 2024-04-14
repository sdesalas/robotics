#include <Arduino.h>
#include <FS.h>
#include <LittleFS.h>
#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ArduinoJson.h>
#include <Ticker.h>

void setup() {
  Board_init();
  GPIO_init();
  GPIO_blink(10, 200);
  FS_init();
  delay(500);
  Settings_init();
  Telemetry_init();
  Wifi_init();
  WebServer_init();
  GPIO_blink(10, 100);
}

void loop() {
  
}
