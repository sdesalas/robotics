#include <Arduino.h>
#include <FS.h>
#include <LittleFS.h>
#include <ESP8266WiFi.h>
#include <DNSServer.h>

DNSServer dnsServer;
IPAddress APIP(192, 168, 6, 1); // Gateway

const char ssid[]="ssid";
const char password[]="password";
const byte DNS_PORT = 53;

void setup() {
  Board_init();
  IO_init();
  IO_blink(10, 200);
  FS_init();
  delay(1000);
  Wifi_init();
  WebServer_start();
  IO_blink(10, 100);
}

void loop() {
  
}
