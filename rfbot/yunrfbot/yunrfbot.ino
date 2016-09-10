/*
 * Yun RF Bot
 * 
 * New and improved version of the RF bot.
 * This time using an Arduino Yun board with 
 * 2x Servos for control.
 * 
 */

#include <VirtualWire.h>

const int RF_RX_PIN = 8;
const int SERVO_L = 6;
const int SERVO_R = 3;
const int LED_PIN = 13;
unsigned long lastMessage = 0;

void setup() {
  Serial.begin(115200);
  Serial1.begin(115200);
  // Setup motor pins
  pinMode(SERVO_L, OUTPUT);
  pinMode(SERVO_R, OUTPUT);
  // Setup RF pins
  pinMode(LED_PIN, OUTPUT);
  vw_set_rx_pin(RF_RX_PIN); 
  vw_setup(2000); // Transmission speed in bits per second.
  vw_rx_start(); // Start the PLL receiver.
  delay(10);
}

void loop() {

  // Reset LED
  digitalWrite(LED_PIN, LOW);

  // Initialize data
  char dir = '-';
  byte power = 0;

  // Read incoming messages
  if(listenRF(dir, power))
  {
    // Give Feedback
    digitalWrite(LED_PIN, HIGH);
    
    if (Serial) {
      Serial.print("Direction: ");
      Serial.print(dir);
      Serial.print(" - Power: ");
      Serial.print(power);
      Serial.println("");
    }
    
    if (Serial1) {
      Serial1.print("Direction: ");
      Serial1.print(dir);
      Serial1.print(" - Power: ");
      Serial1.print(power);
      Serial1.println("");
    }
    
  }

  move(dir, power);
}

bool listenRF(char &dir, byte &power) {
  
  // Initialize data
  uint8_t buf[VW_MAX_MESSAGE_LEN];
  uint8_t buflen = VW_MAX_MESSAGE_LEN;

  // Read incoming messages
  if(vw_get_message(buf, &buflen))
  {
    // Message with a good checksum received, dump HEX
    lastMessage = millis();
    for(int i = 0; i < buflen; ++i)
    {
      if (i == 0) dir = char(buf[i]);
      if (i == 1) power = map(byte(buf[i]), 48, 57, 0, 10);
    }
    return true;
  }
  return false;
}

void move(char dir, byte power) {
  switch(dir) {
    case 'F':
        analogWrite(SERVO_L, 10);
        analogWrite(SERVO_R, 10);
        delay(power * 150);
      break;
    case 'B':
        analogWrite(SERVO_L, 250);
        analogWrite(SERVO_R, 250);
        delay(power * 50);
      break;
    case 'L':
        analogWrite(SERVO_L, 10);
        analogWrite(SERVO_R, 0);
        delay(power * 30);
      break;
    case 'R':
        analogWrite(SERVO_L, 0);
        analogWrite(SERVO_R, 10);
        delay(power * 30);
      break;
    default:
        //if (millis() > lastMessage + 300) 
        //{
        analogWrite(SERVO_L, 0);
        analogWrite(SERVO_R, 0);
        //}
      break;
  }  
}

