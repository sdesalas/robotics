#include "PinChangeInterrupt.h"
#include "WiegandMultiReader.h"

#define PIN_INTERRUPT 7

WIEGAND keypadReader;
int keypadPinD0 = 7; // D7 GREEN "D0"
int keypadPinD1 = 8; // D8 WHITE "D1"
int keypadStatusLED = 3; // D8 STATUS LED 
byte Darr[] = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
int pos = 0;
int arrlen = 20;
void keypadReadD0() {
  keypadReader.ReadD0();
  if (pos < arrlen) Darr[pos++] = 0;
}
void keypadReadD1() {
  keypadReader.ReadD1();
  if (pos < arrlen) Darr[pos++] = 1;
}

void setup() {
  Serial.begin(9600);
  Serial.println();
  Serial.println("Initializing GPIOs...");
  delay(500);

  Serial.println("Starting Wiegand Keypad..");
  pinMode(keypadPinD0, INPUT);
  pinMode(keypadPinD1, INPUT);
  pinMode(keypadStatusLED, OUTPUT);
  digitalWrite(keypadStatusLED, LOW);

  // Note that if connected properly, the wiegand device will run both input
  // pins D0 and D1 as HIGH, so we want to capture falling voltages.
	attachPCINT(digitalPinToPCINT(keypadPinD0), keypadReadD0, FALLING);
	attachPCINT(digitalPinToPCINT(keypadPinD1), keypadReadD1, FALLING);
  
  Serial.println("Ready for input..");
}


void outputpos() {
  Serial.print("Darr:");
  for (int i = 0; i < arrlen; i++) {
    Serial.print(Darr[i]);
    Darr[i] = 0;
  }
  pos = 0;
  Serial.println();
}

void loop() {
  if(keypadReader.available())
  {
    Serial.print("keypadReader WG HEX = ");
    Serial.print(keypadReader.getCode(),HEX);
    Serial.print(", DECIMAL = ");
    Serial.print(keypadReader.getCode());
    Serial.print(", Type W");
    Serial.println(keypadReader.getWiegandType());    
  }
  // Status LEDs (=> ON if device connected properly)
  delay(500);
  outputpos();
  digitalWrite(keypadStatusLED, digitalRead(keypadPinD0) & digitalRead(keypadPinD1));
}
