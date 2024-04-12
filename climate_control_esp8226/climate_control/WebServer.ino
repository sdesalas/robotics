#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <AsyncJson.h>

AsyncWebServer server(80);

void WebServer_init()
{
  server.on("/api/48h.temp.inside.bin", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.temp.inside.bin");
    AsyncResponseStream *response = request->beginResponseStream("application/octet-stream");
    for(int i = 0; i < t48h_n; i++) {
      response->write(highByte(setting_48h_temp[0][i]));
      response->write(lowByte(setting_48h_temp[0][i]));
    }
    request->send(response);
  });

  server.on("/api/48h.temp.outside.bin", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.temp.outside.bin");
    AsyncResponseStream *response = request->beginResponseStream("application/octet-stream");
    for(int i = 0; i < t48h_n; i++) {
      response->write(highByte(setting_48h_temp[1][i]));
      response->write(lowByte(setting_48h_temp[1][i]));
    }
    request->send(response);
  });

  server.on("/api/48h.onoff.bin", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.onoff.bin");
    AsyncResponseStream *response = request->beginResponseStream("application/octet-stream");
    for(int i = 0; i < t48h_n; i++) {
      response->write(setting_48h_onoff[i]);
    }
    request->send(response);
  });

  server.on("/api/48h.temp.inside.json", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.temp.inside.json");
    AsyncJsonResponse * response = new AsyncJsonResponse();
    JsonObject root = response->getRoot();
    JsonArray inside = root.createNestedArray("inside");
    for(int i = 0; i < t48h_n; i++) inside.add(setting_48h_temp[0][i]);
    response->setLength();
    request->send(response);
  });

  server.on("/api/48h.temp.outside.json", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.temp.outside.json");
    AsyncJsonResponse * response = new AsyncJsonResponse();
    JsonObject root = response->getRoot();
    JsonArray outside = root.createNestedArray("outside");
    for(int i = 0; i < t48h_n; i++) outside.add(setting_48h_temp[1][i]);
    response->setLength();
    request->send(response);
  });

  server.on("/api/48h.onoff.json", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.onoff.json");
    AsyncJsonResponse * response = new AsyncJsonResponse();
    JsonObject root = response->getRoot();
    JsonArray onoff = root.createNestedArray("onoff");
    for(int i = 0; i < t48h_n; i++) onoff.add(setting_48h_onoff[i]);
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

  server.on("/settings/reboot.json", HTTP_POST, [](AsyncWebServerRequest *request){
    Serial.println("POST /settings/reboot.json");
    GPIO_blink(2, 10);
    request->send(200);
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
