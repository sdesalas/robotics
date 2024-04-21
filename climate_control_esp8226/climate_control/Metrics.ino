/*
* Metrics collection.
*
* Use both in-memory values and flash storage to collect metrics. So that the system can be rebooted.
* Due to flash degradation, we only have ~10K (conservative) writes per page that we can make so we cant keep rewriting files.
* Instead, we appending to a file regularly and then and rename it once a day when it gets full.
* 
* We then keep a list of 7 files (up to 7 days days worth of data) so they can be plotted on a chart.
*/

#define METRICS_COLLECT_FREQUENCY (1 * MINUTE)
#define METRICS_STORAGE_FREQUENCY (5 * MINUTE)
#define METRICS_BUFFER_SIZE (12*24) // Every 5 mins (12/hour), 24 hours worth of data = 288;
#define METRICS_FILE_COUNT 7 // 7 days of data
#define METRICS_FILE_FORMAT "/metrics/history.#.csv" // 0 = today. 1 = yesterday etc.

Metric metric;
Ticker metricsCollection;
Ticker metricsStorage;

void Metrics_init() {
  // Create initial metric file if not available.
  String filepath = METRICS_FILE_FORMAT;
  filepath.replace("#", "0"); 
  // Read the saved buffer file
  // To get latest reading
  if (LittleFS.exists(filepath)) {
    Metrics_load(filepath.c_str());
  }
  metricsCollection.attach_ms_scheduled(METRICS_COLLECT_FREQUENCY, Metrics_collect);
  metricsStorage.attach_ms_scheduled(METRICS_STORAGE_FREQUENCY, Metrics_store);
  Metrics_collect();
}

void Metrics_load(const char * path) {
  // Opens the buffer CSV file and loads it into memory
  Serial.print("Metrics_load() ");
  Serial.println(path);
  File file = LittleFS.open(path, "r");
  if (!file) return;
  metric.count = 0;
  short inside = 0;
  short outside = 0;
  byte fan = 0;
  // Parse CSV data
  int pos = 0;
  String val = "";
  while(file.available()) {
    char c = file.read();
    switch(c) {
      case ',':
        if (pos == 0) inside = val.toFloat();
        else if (pos == 1) outside = val.toFloat();
        else if (pos == 2) fan = val.toFloat();
        val = "";
        pos++;
        break;
      case '\n':
        // New line.
        metric.inside = inside;
        metric.outside = outside;
        metric.fan = fan;
        metric.count++;
        pos = 0;
        val = "";
        break;
      // Number
      default:
        val.concat(c);
        break;
    }
  }
  // Last line!
  if (pos > 0) {
    metric.inside = inside;
    metric.outside = outside;
    metric.fan = fan;
    metric.count++;
  }
  file.close();
}

void Metrics_collect() {
  Serial.println("Metrics_collect()");
  GPIO_collect(metric);
}

void Metrics_store() {
  Serial.print("Metrics_store() ");
  Serial.println(metric.count);
  // Check the buffer size
  if (metric.count >= METRICS_BUFFER_SIZE) {
    // Looks like we've reached the end of the line!
    // Time to rotate the files
    Metrics_rotate();
    metric.count = 0;
  }
  // Append to history
  String path = METRICS_FILE_FORMAT;
  path.replace("#", "0");
  File file = LittleFS.open(path, "a");
  if (!file) return;
  file.print(metric.inside);
  file.print(",");
  file.print(metric.outside);
  file.print(",");
  file.println(metric.fan);
  file.close();
  // Add to count
  metric.count++;
}

void Metrics_rotate() {
  // Shifts all the metric files
  // Ie history.0.csv -> history.1.csv
  // Then creates a new history.0.csv file
  // And deletes oldest to keep within `METRICS_FILE_COUNT`
  Serial.println("Metrics_rotate()");
  for(int i = METRICS_FILE_COUNT - 1; i >= 0; i--) {
    String fromPath = METRICS_FILE_FORMAT;
    fromPath.replace("#", String(i));
    String toPath = METRICS_FILE_FORMAT;
    toPath.replace("#", String(i+1));
    if (LittleFS.rename(fromPath, toPath)) {
      Serial.printf("Rename [%s] -> [%s]\n", fromPath.c_str(), toPath.c_str());
    }
  }
  // Delete stale data
  String rmPath = METRICS_FILE_FORMAT;
  rmPath.replace("#", String(METRICS_FILE_COUNT));
  if (LittleFS.remove(rmPath)) {
    Serial.printf("Removed [%s]\n", rmPath.c_str());
  }
}