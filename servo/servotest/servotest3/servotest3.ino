/*
  Servo Tester

  Use a Potentiometer to test PWM rotation in a servo 
 */


int PWM = 9;

// the setup function runs once when you press reset or power the board
void setup() {
  pinMode(PWM, OUTPUT);
  delay(10);
}

// the loop function runs over and over again forever
void loop() {
  analogWrite(PWM, 30);
  delay(200);
}
