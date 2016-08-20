/*
  Servo Tester

  Use a Potentiometer to test PWM rotation in a servo 
 */


int POT = 5;
int PWM = 9;

// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin 13 as an output.
  pinMode(POT, INPUT);
  pinMode(PWM, OUTPUT);
  Serial.begin(9600);
}

// the loop function runs over and over again forever
void loop() {
  int str = map(analogRead(POT), 0, 1023, 0, 255);
  if (Serial) {
    Serial.print("Strength: ");
    Serial.print(str);
    Serial.print("\n");  
  }
  analogWrite(PWM, str);
  delay(200);
}
