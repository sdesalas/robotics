/*
 * Joystick Controller
 * 
 * Arduino nano joystick controlling robot via
 * RF 315Mhz tranmitter
 * 
 */

#include <VirtualWire.h>
 
const int RF_TX_PIN = 15;
const int RF_PTT_PIN = 16;
const int LED = A1;
const int X_PIN = A0;
const int Y_PIN = A2;
const int SW_PIN = 10;
const int RED_PIN = 4;
const int GREEN_PIN = 9;
enum Direction { STILL, FORWARD, BACK, LEFT, RIGHT };
String msg;
 
void setup()
{
  Serial.begin(9600);
  // Setup Joystick / Button pins
  pinMode(X_PIN, INPUT);
  pinMode(Y_PIN, INPUT);
  pinMode(SW_PIN, INPUT);
  pinMode(RED_PIN, INPUT);
  pinMode(GREEN_PIN, INPUT);
  // Setup RF
  vw_set_tx_pin(RF_TX_PIN);
  vw_set_ptt_pin(RF_PTT_PIN);
  vw_setup(2000); // Transmission speed bits/sec
}

void loop()
{
  // Initialize
  int x = analogRead(X_PIN);
  int y = analogRead(Y_PIN);
  char dir = '-';
  int power = 0;
  msg = "";
  
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


  // Send direction and power (2 x 8bit values) 
  if (dir != '-') {
    Serial.write("Direction: ");
    Serial.print(dir);
    Serial.write(" - Power:");
    Serial.print(power);
    Serial.write("\n");
    msg = dir;
    msg += char(map(power, 0, 255, 48, 57));
  }
  // Send Button press
  if (digitalRead(SW_PIN) == HIGH) {
    Serial.println("Switch: ON");
    msg = "XX";
  }
  if (digitalRead(RED_PIN) == HIGH) {
    Serial.println("Switch: RED");
    msg = "RR";
  }
  if (digitalRead(GREEN_PIN) == HIGH) {
    Serial.println("Switch: GREEN");
    msg = "GG";
  }

  // Any output? 
  if (msg.length() == 0) {
    digitalWrite(LED, LOW);
  } else {
    // Show lights and send
    analogWrite(LED, power > 0 ? power : 255);
    Serial.println(msg);
    vw_send((uint8_t*)msg.c_str(), msg.length()); 
  }
  
  // Wait 0.1 seconds
  delay(100);
}

