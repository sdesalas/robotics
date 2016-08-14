/* 
 * TRCT5000 IR Obstacle Avoidance Sensor Module
 * 
 * http://www.sainsmart.com/infrared-reflective-photoelectric-switch-ir-barrier-line-track-sensor-tcrt5000l.html
 */

const int DO = 9;
const int AO = 1;

void setup() {
  // put your setup code here, to run once:
  pinMode(DO, INPUT);
  pinMode(AO, INPUT);
  Serial.begin(9600);
}

void loop() {
  // put your main code here, to run repeatedly:
  if (Serial) {
    Serial.print("DO - ");
    Serial.print(digitalRead(DO));
    Serial.print("| DA - ");
    Serial.print(analogRead(AO));
    Serial.print("\n");
  }
  delay(200);
}
