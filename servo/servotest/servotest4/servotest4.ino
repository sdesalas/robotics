int SERVO1 = 3;
int SERVO2 = 6;

void setup() {
  // put your setup code here, to run once:
  pinMode(SERVO1, OUTPUT);
  pinMode(SERVO2, OUTPUT);
}

void loop() {
  // put your main code here, to run repeatedly:
  /*analogWrite(SERVO1, 225);
  analogWrite(SERVO2, 225);
  delay(1000);
  analogWrite(SERVO1, 0);
  analogWrite(SERVO2, 0);
  delay(2000);
  
  analogWrite(SERVO1, 20);
  analogWrite(SERVO2, 20);
  delay(1000);*/

  if (random(20) == 0) {
    analogWrite(SERVO1, 20);
    analogWrite(SERVO2, 20);
    delay(1000);  
  }
  analogWrite(SERVO1, 0);
  analogWrite(SERVO2, 0);
  delay(2000);
}
