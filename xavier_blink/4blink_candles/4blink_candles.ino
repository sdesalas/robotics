/*
  Blink
  Turns on an LED on for one second, then off for one second, repeatedly.

  Most Arduinos have an on-board LED you can control. On the Uno and
  Leonardo, it is attached to digital pin 13. If you're unsure what
  pin the on-board LED is connected to on your Arduino model, check
  the documentation at http://www.arduino.cc

  This example code is in the public domain.

  modified 8 May 2014
  by Scott Fitzgerald
 */


// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin 13 as an output.
  pinMode(2, OUTPUT);
  pinMode(3, OUTPUT);
  pinMode(A2, OUTPUT);
  pinMode(A3, OUTPUT);
}

// the loop function runs over and over again forever
void loop() { 
  digitalWrite(A2, HIGH);
  digitalWrite(2, LOW);    
  delay(200);
  digitalWrite(2, HIGH); 
  digitalWrite(3, LOW);    
  delay(200);
  digitalWrite(3, HIGH);
  digitalWrite(A3, LOW);    
  delay(200);
  digitalWrite(A3, HIGH);
  digitalWrite(A2, LOW);    
  delay(200);
}
