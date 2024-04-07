#include <Ticker.h>

Ticker dnsTicker;

void Wifi_init() {
  Serial.println("Initializing Wifi..");
  Serial.printf("Creating AP '%s'....\n", ssid);
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(APIP, APIP, IPAddress(255, 255, 255, 0));
  WiFi.softAP(ssid, password);
  Serial.println("AP Created! Setting up DNS");
  // DNS spoofing (Only for HTTP)
  dnsServer.start(DNS_PORT, "*", APIP);
  // Check DNS redirect every 100 ms
  dnsTicker.attach_ms(100, []() {
    dnsServer.processNextRequest();
  });
}
