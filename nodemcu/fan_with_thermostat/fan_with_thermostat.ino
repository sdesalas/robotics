/* Multiple DS18B20 1-Wire digital temperature sensors with Arduino example code. More info: https://www.makerguides.com */

// Include the required Arduino libraries:
#include "OneWire.h"
#include "DallasTemperature.h"
#include <LiquidCrystal_I2C.h>

// Define to which pin of the Arduino the 1-Wire bus is connected:
#define ONE_WIRE_BUS 5

// Create a new instance of the oneWire class to communicate with any OneWire device:
OneWire oneWire(ONE_WIRE_BUS);

// Pass the oneWire reference to DallasTemperature library:
DallasTemperature sensors(&oneWire);

// Liquid crystal via I2C
LiquidCrystal_I2C lcd(0x27, 16, 2); // I2C address 0x27, 16 column and 2 rows

int TOO_COLD_INSIDE = 20;
int TOO_WARM_INSIDE = 25;
int TEMP_DEGREES_BUFFER = 2;

bool USE_SERIAL = true;
bool USE_DISPLAY = true;

int FAN = 4;
byte fanOnOff = 0;

int deviceCount = 0;
float tempOutside;
float tempInside;

void setup() {
  pinMode(FAN, OUTPUT);
  // Init output
  if (USE_SERIAL) Serial.begin(9600);
  if (USE_DISPLAY) lcd.init();
  // Start up the library:
  sensors.begin();
  // Locate the devices on the bus:
  println("Locating devices...");
  print("Found ");
  deviceCount = sensors.getDeviceCount();
  print(deviceCount);
  println(" devices");
}

void loop() {
  // Send the command for all devices on the bus to perform a temperature conversion:
  sensors.requestTemperatures();
  printclear();

  // Display temperature from each sensor
  for (int i = 0;  i < deviceCount;  i++) {
    if (i == 0) {
      print("Out:");
      tempOutside = sensors.getTempCByIndex(i);
      print(int(round(tempOutside)));
      print("C");
    }
    if (i == 1) {
      print("In:");
      tempInside = sensors.getTempCByIndex(i);
      print(int(round(tempInside)));
      print("C");
      if (tempInside > TOO_WARM_INSIDE) print(" ! ");
      if (tempInside < TOO_COLD_INSIDE) print(" * ");
    }
    printbreak();
  }

  delay(2000);

  // Is it too warm inside, and cooler outside?
  if (tempInside > TOO_WARM_INSIDE && tempOutside < tempInside - TEMP_DEGREES_BUFFER) {
    printserial("Warm in, cold out.");
    digitalWrite(FAN, 1);
    printON();
  }
  // Is it too cold inside, and warmer outside?
  else if (tempInside < TOO_COLD_INSIDE && tempOutside > tempInside + TEMP_DEGREES_BUFFER) {
    printserial("Cold in, warm out.");
    digitalWrite(FAN, 1);
    printON();
  }
  // No? Then turn fan off.
  else {
    if (USE_SERIAL) print("Same same.");
    digitalWrite(FAN, 0);
    printOFF();
  }

  delay(1000);
}

///////////////////////////////////////////////////////////////////////////

void print(String msg) {
  if (USE_SERIAL) Serial.print(msg);
  if (USE_DISPLAY) lcd.print(msg);
}

void print(int val) {
  if (USE_SERIAL) Serial.print(val);
  if (USE_DISPLAY) lcd.print(val);
}

void print(float val) {
  if (USE_SERIAL) Serial.print(val);
  if (USE_DISPLAY) lcd.print(val);
}

void println(String msg) {
  if (USE_SERIAL) Serial.println(msg);
  if (USE_DISPLAY) lcd.println(msg);
}

void println(int val) {
  if (USE_SERIAL) Serial.println(val); 
  if (USE_DISPLAY) lcd.println(val);
}

void println() {
  if (USE_SERIAL) Serial.println();
  if (USE_DISPLAY) lcd.setCursor(0,0);
}

void printserial(String msg) {
  if (USE_SERIAL) Serial.print(msg);  
}

void printbreak() {
  if (USE_SERIAL) Serial.print(" | ");
  if (USE_DISPLAY) lcd.print(" "); 
}

void printclear() {
  if (USE_SERIAL) Serial.println();
  if (USE_DISPLAY) {
    lcd.clear();
    lcd.setCursor(0,0);
  }
}

void printON() {
  if (USE_SERIAL) Serial.print(" Fan ON");
  if (USE_DISPLAY) {\
    lcd.setCursor(0,1);
    lcd.print("Fan ON  ~~~~");
    lcd.backlight();
  }
}

void printOFF() {
  if (USE_SERIAL) Serial.print(" Fan OFF");
  if (USE_DISPLAY) {
    lcd.setCursor(0,1);
    lcd.print("Fan OFF");
    lcd.noBacklight();
  }
}
