#include "wiegand.h"

// Test with 2 devices connected (card reader + keypad)

WIEGAND cardReader;
int cardPinD0 = 5; // D1 (GPIO5) GREEN "D0"
int cardPinD1 = 4; // D2 (GPIO4) WHITE "D1"
int cardStatusLED = 0; // D3 (GPIO0) STATUS LED
void ICACHE_RAM_ATTR cardReadD0() {
  cardReader.ReadD0();
}
void ICACHE_RAM_ATTR cardReadD1() {
  cardReader.ReadD1();
}

WIEGAND keypadReader;
int keypadPinD0 = 12; // D6 (GPIO12) GREEN "D0"
int keypadPinD1 = 13; // D7 (GPIO13) WHITE "D1"
int keypadStatusLED = 14; // D5 (GPIO14) STATUS LED 
void ICACHE_RAM_ATTR keypadReadD0() {
  keypadReader.ReadD0();
}
void ICACHE_RAM_ATTR keypadReadD1() {
  keypadReader.ReadD1();
}


void setup() {
  Serial.begin(115200);
  Serial.println();

  Serial.println("Starting Wiegand Card Reader..");
  pinMode(cardPinD0, INPUT);
  pinMode(cardPinD1, INPUT);
  pinMode(cardStatusLED, OUTPUT);
	attachInterrupt(digitalPinToInterrupt(cardPinD0), cardReadD0, FALLING);
	attachInterrupt(digitalPinToInterrupt(cardPinD1), cardReadD1, FALLING);

  Serial.println("Starting Wiegand Keypad..");
  pinMode(keypadPinD0, INPUT);
  pinMode(keypadPinD1, INPUT);
  pinMode(keypadStatusLED, OUTPUT);
	attachInterrupt(digitalPinToInterrupt(keypadPinD0), keypadReadD0, FALLING);
	attachInterrupt(digitalPinToInterrupt(keypadPinD1), keypadReadD1, FALLING);
  
  Serial.println("Ready for input..");
}

void loop() {
  if(cardReader.available())
  {
    Serial.print("cardReader WG HEX = ");
    Serial.print(cardReader.getCode(),HEX);
    Serial.print(", DECIMAL = ");
    Serial.print(cardReader.getCode());
    Serial.print(", Type W");
    Serial.println(cardReader.getWiegandType());    
  }
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
  delay(50);
  digitalWrite(cardStatusLED, digitalRead(cardPinD0) & digitalRead(cardPinD1));
  digitalWrite(keypadStatusLED, digitalRead(keypadPinD0) & digitalRead(keypadPinD1));
}
