#include "wiegand.h"

WIEGAND wg;

int PinD0 = 5; // D1 (GPIO5) GREEN "D0"
int PinD1 = 4; // D2 (GPIO4) WHITE "D1"
int LedD0 = 12; // D6 (GPIO12)
int LedD1 = 13; // D7 (GPIO13)

//int PinD0 = 14; // D5 (GPIO14)
//int PinD1 = 12; // D6 (GPIO12)

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("Starting Wiegand Reader..");
  pinMode(PinD0, INPUT);
  pinMode(PinD1, INPUT);
  pinMode(LedD0, OUTPUT);
  pinMode(LedD1, OUTPUT);
  
  // default Wiegand Pin 2 and Pin 3 see image on README.md
  // for non UNO board, use wg.begin(pinD0, pinD1) where pinD0 and pinD1 
  // are the pins connected to D0 and D1 of wiegand reader respectively.
  wg.begin(5, 4);
  Serial.println("Ready for input..");
}

void loop() {
  if(wg.available())
  {
    Serial.print("Wiegand HEX = ");
    Serial.print(wg.getCode(),HEX);
    Serial.print(", DECIMAL = ");
    Serial.print(wg.getCode());
    Serial.print(", Type W");
    Serial.println(wg.getWiegandType());    
  }
  delay(50);
  digitalWrite(LedD0, digitalRead(PinD0));
  digitalWrite(LedD1, digitalRead(PinD1));
}
