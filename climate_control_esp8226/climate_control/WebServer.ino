#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <AsyncJson.h>
#include <ArduinoJson.h>

AsyncWebServer server(80);

void WebServer_start()
{
  server.on("/hello", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /hello");
    request->send_P(200, "text/html", "Hello World");
  });

  server.on("/api/48h.temp.bin", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.temp.bin");
    AsyncResponseStream *response = request->beginResponseStream("application/octet-stream");
    for(int i = 0; i < T48H_n; i++) {
      response->write(highByte(T48H_inside[i]));
      response->write(lowByte(T48H_inside[i]));
      response->write(highByte(T48H_outside[i]));
      response->write(lowByte(T48H_outside[i]));
      response->write(T48H_onoff[i]);
    }
    request->send(response);
  });

  server.on("/api/48h.temp.inside.bin", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.temp.inside.bin");
    AsyncResponseStream *response = request->beginResponseStream("application/octet-stream");
    for(int i = 0; i < T48H_n; i++) {
      response->write(highByte(T48H_inside[i]));
      response->write(lowByte(T48H_inside[i]));
    }
    request->send(response);
  });

  server.on("/api/48h.temp.outside.bin", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.temp.outside.bin");
    AsyncResponseStream *response = request->beginResponseStream("application/octet-stream");
    for(int i = 0; i < T48H_n; i++) {
      response->write(highByte(T48H_outside[i]));
      response->write(lowByte(T48H_outside[i]));
    }
    request->send(response);
  });

  server.on("/api/48h.onoff.bin", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.onoff.bin");
    AsyncResponseStream *response = request->beginResponseStream("application/octet-stream");
    for(int i = 0; i < T48H_n; i++) {
      response->write(T48H_onoff[i]);
    }
    request->send(response);
  });

  server.on("/api/48h.temp.inside.json", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.temp.inside.json");
    AsyncJsonResponse * response = new AsyncJsonResponse();
    JsonObject root = response->getRoot();
    JsonArray inside = root.createNestedArray("inside");
    for(int i = 0; i < T48H_n; i++) inside.add(T48H_inside[i]);
    response->setLength();
    request->send(response);
  });

  server.on("/api/48h.temp.outside.json", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.temp.outside.json");
    AsyncJsonResponse * response = new AsyncJsonResponse();
    JsonObject root = response->getRoot();
    JsonArray outside = root.createNestedArray("outside");
    for(int i = 0; i < T48H_n; i++) outside.add(T48H_outside[i]);
    response->setLength();
    request->send(response);
  });

  server.on("/api/48h.onoff.json", HTTP_GET, [](AsyncWebServerRequest *request){
    Serial.println("GET /api/48h.onoff.json");
    AsyncJsonResponse * response = new AsyncJsonResponse();
    JsonObject root = response->getRoot();
    JsonArray onoff = root.createNestedArray("onoff");
    for(int i = 0; i < T48H_n; i++) onoff.add(T48H_onoff[i]);
    response->setLength();
    request->send(response);
  });

  server
    .serveStatic("/", LittleFS, "/www/")
    .setCacheControl("max-age=300") // cache files for 5 minutes
    .setDefaultFile("index.html");

  server
    .serveStatic("/admin", LittleFS, "/admin/")
    .setCacheControl("max-age=30") // cache files for 30 seconds
    .setDefaultFile("index.html")
    .setAuthentication(ssid, password);

  server.begin();
}
