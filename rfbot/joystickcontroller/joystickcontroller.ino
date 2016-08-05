/*
 * Joystick Controller
 * 
 * Arduino nano joystick controlling robot via
 * RF 315Mhz tranmitter
 * 
 */

#include <VirtualWire.h>
 
const int RF_TX_PIN = 15;
const int RF_PTT_PIN = 9;
const int X_PIN = A0;
const int Y_PIN = A2;
const int SW_PIN = 10;
const int RED_LED = A1;
enum Direction { STILL, FORWARD, BACK, LEFT, RIGHT };
 
void setup()
{
  Serial.begin(9600);
  // Setup Joystick and RF pins
  pinMode(X_PIN, INPUT);
  pinMode(Y_PIN, INPUT);
  vw_set_tx_pin(RF_TX_PIN);
  vw_set_ptt_pin(RF_PTT_PIN);
  vw_setup(2000); // Transmission speed in bits per second.
}

void loop()
{
  // Initialize
  int x = analogRead(X_PIN);
  int y = analogRead(Y_PIN);
  char dir = '-';
  int power = 0;
  // Determine direction and power
  if (y >= 300 && y <= 700) {
    if (x >= 300 && x <= 700) {
        dir = '-';
    } else if (x < 300) {
        dir = 'L';
        power = map(x, 300, 0, 0, 255);
    } else {
      dir = 'R';
      power = map(x, 700, 1024, 0, 255);
    } 
  } else if (y < 300) {
        dir = 'F';
        power = map(y, 300, 0, 0, 255);
  } else {
        dir = 'B';
        power = map(y, 700, 1024, 0, 255);
  }

  // Constrain just in case
  power = constrain(power, 0, 255);
  
  // Show lights for what we are doing
  analogWrite(RED_LED, digitalRead(SW_PIN) == HIGH ? 255 : power);

  // Send Button press
  if (digitalRead(SW_PIN) == HIGH) {
    Serial.println("Switch: ON");
    vw_send((uint8_t *)"XX", 2);
  }
  // Send direction and power (2 x 8bit values) 
  else if (dir != '-') {
    Serial.write("Direction: ");
    Serial.print(dir);
    Serial.write(" - Power:");
    Serial.print(power);
    Serial.write("\n");
    byte msg[] = {byte(dir), byte(map(power, 0, 255, 48, 57))}; 
    vw_send((uint8_t *)msg, 2); 
  }
  
  // Wait 0.1 seconds
  delay(100);
}

