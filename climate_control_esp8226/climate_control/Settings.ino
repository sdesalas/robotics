const int t48h_n = 12*48;
short setting_temp_inside;
short setting_temp_outside;
byte setting_onoff;
short setting_48h_temp[2][t48h_n]; // 0 = inside / 1 = outside
byte setting_48h_onoff[t48h_n];

const int t7d_n = 4*24*7;
short setting_7d_temp[2][t48h_n]; // 0 = inside / 1 = outside
byte setting_7d_onoff[t7d_n];

String setting_wifi_ssid = "";
String setting_wifi_password = "";
boolean setting_wifi_hidden = false;
boolean setting_fan_enabled = false;
int setting_fan_cold = 0;
int setting_fan_hot = 0;
int setting_fan_buffer = 0;
boolean setting_server_ota = false;
int setting_telemetry_frequency = 0;
String setting_telemetry_url = "";
String setting_telemetry_bucket = "";
String setting_telemetry_org = "";
String setting_telemetry_token = "";
String setting_telemetry_ssid = "";
String setting_telemetry_password = "";

void Settings_init() {
  // Initialize the buffers 
  for(int i = 0; i < t48h_n; i++) {
    setting_48h_temp[0][i] = 2000;
    setting_48h_temp[1][i] = 1500;
    setting_48h_onoff[i] = 0;
  }
  for(int i = 0; i < t7d_n; i++) {
    setting_7d_temp[0][i] = 2000;
    setting_7d_temp[1][i] = 1500;
    setting_7d_onoff[i] = 0;
  }
  // Initialize the settings
  Settings_load("wifi.json");
  Settings_load("fan.json");
  Settings_load("telemetry.json");
  Serial.print("The SSID is ");
  Serial.println(setting_wifi_ssid);
  Serial.print("Telemetry URL is ");
  Serial.println(setting_telemetry_url);
  Serial.print("Telemetry frequency is ");
  Serial.println(setting_telemetry_frequency);
  Serial.print("Fan cold is ");
  Serial.println(setting_fan_cold);
}

void Settings_load(const char* file) {
    char settingsFile[80];
    strcpy(settingsFile, "/settings/");
    strcat(settingsFile, file);
    JsonDocument doc = FS_readJson(settingsFile);
    JsonObject setting = doc.as<JsonObject>();
    if (strcmp(file, "fan.json") == 0) {
      setting_fan_enabled = setting["enabled"] | false;
      setting_fan_cold = setting["cold"] | 0;
      setting_fan_hot = setting["hot"] | 0;
      setting_fan_buffer = setting["buffer"] | 0;
    }
    if (strcmp(file, "wifi.json") == 0) {
      setting_wifi_ssid = setting["ssid"] | "";
      setting_wifi_password = setting["password"] | "";
      setting_wifi_hidden = setting["hidden"] | false;
    }
    if (strcmp(file, "telemetry.json") == 0) {
      setting_telemetry_frequency = setting["frequency"] | 0;
      setting_telemetry_url = setting["url"] | "";
      setting_telemetry_bucket = setting["bucket"] | "";
      setting_telemetry_org = setting["org"] | "";
      setting_telemetry_token = setting["token"] | "";
      setting_telemetry_ssid = setting["ssid"] | "";
      setting_telemetry_password = setting["password"] | "";
    }
}

bool Settings_save(JsonObjectConst input, const char* file) {
    // Get the defaults, then overwrite with input
    char defaultsFile[80];
    strcpy(defaultsFile, "/defaults/");
    strcat(defaultsFile, file);
    JsonDocument doc = FS_readJson(defaultsFile);
    JsonObject settings = doc.as<JsonObject>();
    for (JsonPairConst kv: input) {
      settings[kv.key()] = kv.value();
    }
    // Save settings to file
    char settingsFile[80];
    strcpy(settingsFile, "/settings/");
    strcat(settingsFile, file);
    return FS_writeJson(settingsFile, settings) > 0;
}