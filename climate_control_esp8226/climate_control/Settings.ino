
void Settings_init() {
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
      setting_fan_sensorswap = setting["sensorswap"] | false;
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
    if (strcmp(file, "reboot.json") == 0) {
      setting_reboot_ota = setting["ota"] | false;
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