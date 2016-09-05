/*
  Servo Tester

  Use a Potentiometer to test PWM rotation in a servo 
 */


int POT = 5;
int PWM = 9;
int BUZ = 10;

// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin 13 as an output.
  pinMode(POT, INPUT);
  pinMode(PWM, OUTPUT);
  Serial.begin(9600);
}

// the loop function runs over and over again forever
void loop() {
  int pot = analogRead(POT);
  int str = map(pot, 0, 1023, 0, 255);
  if (Serial) {
    Serial.print("Strength: ");
    Serial.print(str);
    Serial.print("\n");  
  }
  tone(BUZ, map(pot, 0, 1023, 300, 3000));
  analogWrite(PWM, str);
  delay(200);
}
