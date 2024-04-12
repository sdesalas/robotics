int MAX_DEPTH = 3;

void FS_init() {
  // Initialize LittleFS
  if(!LittleFS.begin()){
    Serial.println("Unable to mount LittleFS.");
    return;
  }

  Serial.println("LittleFS mounted successfully.");
  FS_info();
  Serial.println("Listing directory: /");
  FS_listDirectory("/");
}

void FS_info() {
  FSInfo fs_info;
  LittleFS.info(fs_info);
  Serial.print("Total Bytes: ");
  Serial.println(fs_info.totalBytes);
  Serial.print("Used Bytes: ");
  Serial.println(fs_info.usedBytes);
}

void FS_listDirectory(const char * dirname) {
  FS_listDirectory(dirname, MAX_DEPTH, 0);
}

void FS_listDirectory(const char * dirname, int depth, int level) {
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
        FS_listDirectory(root.fileName().c_str(), depth, depth+1);
      }
    } else {
      Serial.println("  | (file)");  
    }
  }
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