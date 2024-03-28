#include <OneWire.h>
#include <DallasTemperature.h>

const int SensorDataPin = 5;     

OneWire oneWire(SensorDataPin);
DallasTemperature sensors(&oneWire);

void setup() {
pinMode(SensorDataPin, INPUT);
  Serial.begin(9600);
  sensors.begin();
}

void loop() {
  Serial.print("Millis:");
  Serial.println(millis());
  delay(1000);
  temp();
}

void temp() {
  sensors.requestTemperatures(); 
  float temperature_Celsius = sensors.getTempCByIndex(0);
  float temperature_Fahrenheit = sensors.getTempFByIndex(0);
  Serial.print("Temperature: ");
  Serial.print(temperature_Celsius);
  Serial.println(" ºC");
  Serial.print("Temperature: ");
  Serial.print(temperature_Fahrenheit);
  Serial.println(" ºF");
  Serial.println("");
  // delay(10000);
}
