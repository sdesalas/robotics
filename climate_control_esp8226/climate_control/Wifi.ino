
// DNSServer dnsServer;
IPAddress APIP(192, 168, 6, 1); // Gateway

// const byte DNS_PORT = 53;

// Ticker dnsTicker;
Ticker blinker;

void Wifi_init() {
  const char* ssid = setting_wifi_ssid.c_str();
  const char* password = setting_wifi_password.c_str();
  Serial.println("Initializing Wifi..");
  Serial.printf("Creating AP '%s' with password '%s'....\n", setting_wifi_ssid.c_str(),  setting_wifi_password.c_str());
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(APIP, APIP, IPAddress(255, 255, 255, 0));
  WiFi.softAP(ssid, password);
  // Serial.println("AP Created! Setting up DNS");
  // DNS spoofing (Only for HTTP)
  //dnsServer.start(DNS_PORT, "*", APIP);
  // Check DNS redirect every 100 ms
  // dnsTicker.attach_ms(100, []() {
  //   dnsServer.processNextRequest();
  // });
  // Blink every 5 seconds
  blinker.attach_ms_scheduled(5005, []() {
    Serial.print("ESP.getFreeHeap(): ");
    Serial.println(ESP.getFreeHeap());
    GPIO_blink(WiFi.softAPgetStationNum() + 1, 100);
    digitalWrite(GPIO_RED_LED, WiFi.softAPgetStationNum() > 0 ? 1 : 0);
  });
}
