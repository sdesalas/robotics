/*
 * Arduino EMI Sensor
 * By Steven de Salas
 * 
 * A simple sensor that detects 
 * electromagnetic inteference.
 * 
 * (antenna)
 *  Y    +--------+
 *  |    |*      *|9 --O-| LED
 *  |  A1|*      *|8 --O-| LED
 *  |  A2|*      *|7 --O-| LED
 *  |- A3|*      *|6 --O-| LED
 *       |*      *|5     |
 *       |*      *|GND --|
 *       +--------+
 */
 
int leds[] = { 6, 7, 8, 9};
int thresholds[] = { 256, 512, 768, 950};

void setup() {
  for (byte i = 0; i < 4; i++) {
    pinMode(leds[i], OUTPUT);
  }
  pinMode(A3, INPUT);
}

void loop() { 
  int emi = analogRead(A3); 
  for (byte i = 0; i < 4; i++) {
    digitalWrite(leds[i], emi > thresholds[i] ? 1 : 0);
  }
  delay(10);
}

