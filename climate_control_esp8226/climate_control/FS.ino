int MAX_DEPTH = 3;

void FS_init() {
  // Initialize LittleFS
  if(!LittleFS.begin()){
    Serial.println("Unable to mount LittleFS.");
    return;
  }

  Serial.println("LittleFS mounted successfully.");
  FSInfo info;
  LittleFS.info(info);
  Serial.print("Total Bytes: ");
  Serial.println(info.totalBytes);
  Serial.print("Used Bytes: ");
  Serial.println(info.usedBytes);
  Serial.println("Listing directory: /");
  FS_list("/");
}

void FS_list(const char * dirname) {
  FS_list(dirname, MAX_DEPTH, 0);
}

void FS_list(const char * dirname, int depth, int level) {
  Dir root = LittleFS.openDir(dirname);

  while (root.next()) {
    File file = root.openFile("r");
    for (int i = 0; i<level; i++) Serial.print(" ");
    Serial.print("- ");
    Serial.print(root.fileName());
    Serial.print("  |  ");
    Serial.print(file.size());
    Serial.print(" bytes ");
    file.close();
    if (root.isDirectory()) {
      Serial.println("  | (dir)");
      if (level <= depth) {
        FS_list(root.fileName().c_str(), depth, depth+1);
      }
    } else {
      Serial.println("  | (file)");  
    }
  }
}

JsonDocument FS_infoJson() {
  FSInfo info;
  LittleFS.info(info);
  JsonDocument doc;
  JsonObject root = doc.to<JsonObject>();
  root["total"] = info.totalBytes;
  root["used"] = info.usedBytes;
  root["files"] = FS_listJson("/", MAX_DEPTH, 0);
  return doc;
}

JsonDocument FS_listJson(const char * dirname, int depth, int level) {
  JsonDocument doc;
  JsonArray arr = doc.to<JsonArray>();
  Dir root = LittleFS.openDir(dirname);
  while (root.next()) {
    JsonDocument item;
    JsonObject obj = item.to<JsonObject>();
    File file = root.openFile("r");
    obj["n"] = root.fileName();
    obj["s"] = file.size();
    obj["t"] = root.isDirectory() ? "d" : "f";
    file.close();
    if (root.isDirectory() && level <= depth) {
        obj["c"] = FS_listJson(root.fileName().c_str(), depth, depth+1);
    }
    arr.add(item);
  }
  return doc;
}

JsonDocument FS_readJson(const char * path) {
  Serial.print("Reading JSON from ");
  Serial.println(path);
  JsonDocument doc;
  File file = LittleFS.open(path, "r");
  if (!file) {
    Serial.println("That file does not exist!");
  } else {
    deserializeJson(doc, file);
  }
  file.close();
  serializeJson(doc, Serial);
  Serial.println();
  return doc;
}

bool FS_writeJson(const char * path, const JsonVariant json) {
  Serial.print("Writing JSON to ");
  Serial.println(path);
  serializeJson(json, Serial);
  Serial.println();
  File file = LittleFS.open(path, "w");
  size_t bytes = serializeJsonPretty(json, file);
  file.close();
  return bytes > 0;
}