/*
 * Simple RF Bot
 * 
 * By Steven de Salas
 * 
 * Simple bot that uses a Radio Frequency 
 * receiver (315Mhz) for control.
 */
#include "VirtualWire.h"
#include "Queue.h";

const int W1_DIR = 4;
const int W1_PWM = 5;
const int W2_PWM = 6;
const int W2_DIR = 7;
const int RF_RX_PIN = 16;
const int LED_PIN = 8;
unsigned long lastMessage = 0;
struct Message { char dir; byte power; };
Queue<Message> messages(16);

void setup() {
  Serial.begin(9600);
  // Setup motor pins
  pinMode(W1_PWM, OUTPUT);
  pinMode(W1_DIR, OUTPUT);
  pinMode(W2_DIR, OUTPUT);
  pinMode(W2_PWM, OUTPUT);
  // Setup RF pins
  pinMode(LED_PIN, OUTPUT);
  vw_set_rx_pin(RF_RX_PIN); 
  vw_setup(2000); // Transmission speed in bits per second.
  vw_rx_start(); // Start the PLL receiver.
}

void loop() {
  // Reset LED
  digitalWrite(LED_PIN, LOW);

  // Initialize data
  String comdata = "";
  uint8_t buf[VW_MAX_MESSAGE_LEN];
  uint8_t buflen = VW_MAX_MESSAGE_LEN;

  // Read incoming messages
  if(vw_get_message(buf, &buflen))
  {
    // Message with a good checksum received, dump HEX
    char dir = '-';
    byte power = 0;
    lastMessage = millis();
    for(int i = 0; i < buflen; ++i)
    {
      if (i == 0) dir = char(buf[i]);
      if (i == 1) power = map(byte(buf[i]), 48, 57, 0, 10);
    }
    // Give Feedback
    digitalWrite(LED_PIN, HIGH);
    if (Serial) {
      Serial.print("Direction: ");
      Serial.print(dir);
      Serial.print(" - Power: ");
      Serial.print(power);
      Serial.println("");
    }
    while(power > 0) {
      messages.push(Message({ dir, power-- }));
    }
  }

  if (messages.count() == 0) {
    digitalWrite(W1_DIR, LOW);
    analogWrite(W1_PWM, 0);
    digitalWrite(W2_DIR, LOW);
    analogWrite(W2_PWM, 0);
  } else {
    Message message = messages.pop();
    switch(message.dir) {
      case 'F':
          digitalWrite(W1_DIR, HIGH);
          analogWrite(W1_PWM, 0);
          digitalWrite(W2_DIR, HIGH);
          analogWrite(W2_PWM, 0);
          delay(100);
        break;
      case 'B':
          digitalWrite(W1_DIR, LOW);
          analogWrite(W1_PWM, 255);
          digitalWrite(W2_DIR, LOW);
          analogWrite(W2_PWM, 255);
          delay(50);
        break;
      case 'L':
          digitalWrite(W1_DIR, HIGH);
          analogWrite(W1_PWM, 0);
          digitalWrite(W2_DIR, LOW);
          analogWrite(W2_PWM, 255);
          delay(30);
        break;
      case 'R':
          digitalWrite(W1_DIR, LOW);
          analogWrite(W1_PWM, 255);
          digitalWrite(W2_DIR, HIGH);
          analogWrite(W2_PWM, 0);
          delay(30);
        break;
    }
  }
  //
}
