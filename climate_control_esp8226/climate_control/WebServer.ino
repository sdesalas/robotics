#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <AsyncJson.h>

AsyncWebServer server(80);

void WebServer_init()
{
  server.on("/metrics/history.csv", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /metrics/csv");
    AsyncResponseStream *response = request->beginResponseStream("text/csv");
    // Stream 3x history files backwards from oldest to newest
    // 48 hours of data minimum
    for(int i = 3; i >= 0; i--) {
      String path = METRICS_FILE_FORMAT;
      path.replace("#", String(i));
      Serial.print("Reading: ");
      Serial.println(path);
      File file = LittleFS.open(path.c_str(), "r");
      if (file) {
        char c;
        while (file.available()) {
          c = file.read();
          response->write(c);
        }
        // Add EOL per file; 
        if (c != '\n') response->write('\n');
        file.close();
      }
    }
    request->send(response);
  });

  server.on("/metrics/current.json", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /metrics/current.json");
    AsyncJsonResponse * response = new AsyncJsonResponse();
    JsonObject root = response->getRoot();
    root["inside"] = metric.inside;
    root["outside"] = metric.outside;
    root["fan"] = metric.fan;
    root["count"] = metric.count;
    response->setLength();
    request->send(response);
  });

  server.addHandler(new AsyncCallbackJsonWebHandler("/settings/fan.json", [](AsyncWebServerRequest *request, JsonVariant &json) {
    Serial.println("POST /settings/fan.json");
    Settings_save(json.as<JsonObject>(), "fan.json");
    Settings_load("fan.json");
    GPIO_blink(2, 10);
    request->send(200);
  }));

  server.addHandler(new AsyncCallbackJsonWebHandler("/settings/wifi.json", [](AsyncWebServerRequest *request, JsonVariant &json) {
    Serial.println("POST /settings/wifi.json");
    Settings_save(json.as<JsonObject>(), "wifi.json");
    Settings_load("wifi.json");
    GPIO_blink(2, 10);
    request->send(200);
  }));

  server.addHandler(new AsyncCallbackJsonWebHandler("/settings/telemetry.json", [](AsyncWebServerRequest *request, JsonVariant &json) {
    Serial.println("POST /settings/telemetry.json");
    Settings_save(json.as<JsonObject>(), "telemetry.json");
    Settings_load("telemetry.json");
    Telemetry_init();
    GPIO_blink(2, 10);
    request->send(200);
  }));

  server.addHandler(new AsyncCallbackJsonWebHandler("/settings/reboot.json", [](AsyncWebServerRequest *request, JsonVariant &json) {
    Serial.println("POST /settings/reboot.json");
    Settings_save(json.as<JsonObject>(), "reboot.json");
    Settings_load("reboot.json");
    GPIO_blink(2, 10);
    request->send(200);
  }));

  server.on("/api/reboot", HTTP_POST, [](AsyncWebServerRequest *request){
    Serial.println("POST /api/reboot");
    // TODO: Check auth header vs setting
    GPIO_blink(10, 10);
    request->send(200);
    delay(500);
    ESP.restart();
  });

  server.on("/settings/files.json", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /settings/files.json");
    GPIO_blink(2, 10);
    AsyncResponseStream *response = request->beginResponseStream("application/json");
    JsonDocument doc = FS_infoJson();
    serializeJson(doc, *response);
    request->send(response);
  });

  server
    .serveStatic("/", LittleFS, "/www/")
    .setCacheControl("max-age=300") // 5 minutes
    .setDefaultFile("index.html");

  server
    .serveStatic("/settings", LittleFS, "/settings/")
    .setCacheControl("no-cache, no-store, must-revalidate") 
    .setAuthentication("admin", setting_wifi_password.c_str());

  server
    .serveStatic("/admin", LittleFS, "/admin/")
    .setCacheControl("max-age=300") // 5 minutes
    .setDefaultFile("index.html")
    .setAuthentication("admin", setting_wifi_password.c_str());

  server.begin();
}
