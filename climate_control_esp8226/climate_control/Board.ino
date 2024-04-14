
void Board_init() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("=================================");
  Serial.print("ESP.getChipId(): ");
  Serial.println(ESP.getChipId());
  Serial.print("ESP.getCoreVersion(): ");
  Serial.println(ESP.getCoreVersion());
  Serial.print("ESP.getSdkVersion(): ");
  Serial.println(ESP.getSdkVersion());
  Serial.print("ESP.getCpuFreqMHz(): ");
  Serial.println(ESP.getCpuFreqMHz());
  Serial.print("ESP.getSketchSize(): ");
  Serial.println(ESP.getSketchSize());
  Serial.print("ESP.getSketchMD5(): ");
  Serial.println(ESP.getSketchMD5().substring(0,6));
  Serial.print("ESP.getFreeSketchSpace(): ");
  Serial.println(ESP.getFreeSketchSpace());
  Serial.print("ESP.getFreeHeap(): ");
  Serial.println(ESP.getFreeHeap());
  Serial.print("ESP.getHeapFragmentation(): ");
  Serial.println(ESP.getHeapFragmentation());
  Serial.print("ESP.getFlashChipSize(): ");
  Serial.println(ESP.getFlashChipSize());
  Serial.print("ESP.getFlashChipSpeed(): ");
  Serial.print(ESP.getFlashChipSpeed() / 1000 / 1000);
  Serial.println("Mhz");
  Serial.println("=================================");
}
