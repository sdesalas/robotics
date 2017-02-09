/*
  serial test
  
  Turns on an LED on for one second, then off for one second.
  Sends serial messages at the same time
 
 */


// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin 13 as an output.
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  delay(10);
}

// the loop function runs over and over again forever
void loop() {
  /*Serial.print(millis());
  Serial.println(":");
  while (Serial && Serial.available()) {
    Serial.print(Serial.read());
  }
  delay(1000);*/
  if (Serial) {
    Serial.println("HIGH");
    digitalWrite(13, HIGH);
  }
  delay(1000);              
  if (Serial) {
    Serial.println("LOW");  
    digitalWrite(13, LOW);    
  }
  delay(1000);              
}
