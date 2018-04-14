

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  Serial1.begin(57600);
}

void loop() {
  // put your main code here, to run repeatedly:
  if (Serial.available()) {
    String data = "";
    while(Serial.available()) {
      data += Serial.read();
    }
    Serial.println(data);
    Serial1.println(data);
    data = "";
  }

  if (Serial1.available()) {
    String data = "";
    while(Serial1.available()) {
      data += Serial1.read();
    }
    Serial.println(data);
    Serial1.println(data);
    data = "";
  }
}
