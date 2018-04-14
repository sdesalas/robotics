/*
  controller.ino

  By: Steven de Salas
  On: February 2016

  Controller code for NALA.
  Context:  Arduino Yun, NodeJS installed
  
  Runs Node.js processes asynchronously using
  the Process class abd communicating via STDIN and STDOUT.

  Processes incoming input and outputs

 */

#include <Process.h>
#include <toneAC.h>
Process nodejs;    // make a new Process for calling Node

// AUDIO INPUT VIA MSGEQ7
int analogPin = 0; // read from multiplexer using analog input 0
int strobePin = 2; // strobe is attached to digital pin 2
int resetPin = 3; // reset is attached to digital pin 3
int spectrumValue[7]; // to hold a2d values

// DISPLAY ON MSGEQ7
int greenLED = 7;
int yellowLED = 6;
int redLED = 5;

// AUDIO OUTPUT VIA BUZZER
int pitch[7] = {63, 160, 400, 1000, 2500, 6250, 16000};
unsigned long startTicks;
int audioPin = 9;

// POSITIVE REINFORCEMENT BUTTON
int buttonPin = 12;
int blueLED = 11;

// WORKING VARIABLES
bool isSound = false;
bool isSoundTm1 = false;
bool isSoundTm2 = false;
bool saveSound = false;
byte sound[128][7];


// ==========================================================
//                         SETUP
// ==========================================================
void setup() {
  
  Serial.begin(19200); // Initialize the Serial

  pinMode(analogPin, INPUT);
  pinMode(strobePin, OUTPUT);
  pinMode(resetPin, OUTPUT);
  pinMode(audioPin, OUTPUT);

  pinMode(greenLED, OUTPUT);
  pinMode(yellowLED, OUTPUT);
  pinMode(redLED, OUTPUT);
  pinMode(blueLED, OUTPUT);

  analogReference(DEFAULT);

  digitalWrite(greenLED, HIGH);
  digitalWrite(resetPin, LOW);
  digitalWrite(strobePin, HIGH);
  digitalWrite(buttonPin, LOW);

  // Wait until a Serial Monitor is connected.
  while (!Serial && digitalRead(buttonPin) == LOW) {
    digitalWrite(greenLED, LOW);
    delay(300);
    digitalWrite(greenLED, HIGH);   
    delay(300);
  };

  // Initialize the Bridge  
  // and run nodejs
  Bridge.begin();  
  nodejs.runShellCommandAsynchronously("node /mnt/sda1/arduino/nala/nala.js");
  log("Started process\n");

  flushNode();

}



// ==========================================================
//                         THE LOOP
// ==========================================================

void loop() {
  // Is there some output ready (when we are not listening)
  if (nodejs.available()) {
    //vibrateSpeaker();
    flushNode();
  } else {
    checkButton();
    checkMSGEQ7();
    //vibrateSpeaker();
    //echoSpeaker2();
  }
}

void checkButton() {

  // Is there a button press?
  if (digitalRead(buttonPin) == HIGH) {

    // Switch blue light 1 sec
    digitalWrite(blueLED, HIGH);
    delay(500);
    digitalWrite(blueLED, LOW);   
    delay(1000);
  }
  
}


void checkMSGEQ7() {

  digitalWrite(resetPin, HIGH);
  digitalWrite(resetPin, LOW);

  for (int i = 0; i < 7; i++)
  {
    digitalWrite(strobePin, LOW);
    delayMicroseconds(30); // to allow the output to settle
    spectrumValue[i] = analogRead(analogPin);
    logSpectrumValue(i);
    digitalWrite(strobePin, HIGH);
  }

  log("\n");

}


void vibrateSpeaker() {

  // Ticks are used to work out duty cycle
  unsigned long startTicks = micros();
  
  while (nodejs.available()) 
  {
    // Show we are talking
    digitalWrite(greenLED, LOW);

    // Each batch will last approx 50ms
    unsigned long batchStart = micros();
    int amplitude[7];
    for (int i = 0; i < 7; i++) {
      if (nodejs.available()) {
        // Work out frequency strength (0-10)
        amplitude[i] = map(nodejs.read(), 48, 112, 0, 10);
      } else {
        amplitude[i] = 0;
      }
    }

    // Run Batch
    while(micros() - batchStart < 70000) {
      int cycle = 0;
      unsigned long ticks = micros() - startTicks;
      for (int i = 0; i < 7; i++) {
        // Work out duty cycle.
        // Are we high or low?
        unsigned int phase = 1000000 / pitch[i];
        if ((ticks % phase) > (phase / 2)) 
          cycle += amplitude[i];
        else 
          cycle -= amplitude[i];
      }
      // Vibrate HIGH or LOW depending on duty cycle
      digitalWrite(audioPin, (cycle > 0) ? HIGH : LOW);
    }
  }
  // Show we are listening
  digitalWrite(greenLED, HIGH);
}


void echoSpeaker() {

  // Ticks are used to work out duty cycle
  unsigned long startTicks = micros();

  // Run Batch
  while(micros() - startTicks < 50000) {
    int cycle = 0;
    unsigned long ticks = micros() - startTicks;
    for (int i = 0; i < 7; i++) {
      // Work out duty cycle.
      // Are we high or low?
      unsigned int phase = 1000000 / pitch[i];
      if ((ticks % phase) > (phase / 2)) 
        cycle += map(spectrumValue[i], 0, 1024, 0, 10);
      else 
        cycle -= map(spectrumValue[i], 0, 1024, 0, 10);
    }
    // Vibrate HIGH or LOW depending on duty cycle
    if (cycle > 1) digitalWrite(audioPin, HIGH);
    else if (cycle < -1) digitalWrite(audioPin, LOW);
    
  }

  // Reset
  for (int i = 0; i < 7; i++) {
    spectrumValue[i] = 0;
  }

}


void echoSpeaker2() {

  int top = 0;
  int amplitude[7];

  for (int i = 0; i < 7; i++) {
    amplitude[i] = map(spectrumValue[i], 0, 1024, 0, 10);
    amplitude[i] = constrain(amplitude[i], 0, 10);
    if (amplitude[i] > amplitude[top]) {
      top = i;
    }
  }
  
  if (amplitude[top] > 0) {
    toneAC(pitch[top], amplitude[top], 50);
  }

}

// ==========================================================
//                         UTILS
// ==========================================================


void log(byte b) {
  if (Serial) Serial.write(b);
}

void log(int i) {
  if (Serial) Serial.write(i);
}

void log(String s) {
  if (Serial) Serial.print(s);
}

void logSpectrumValue(int i) {
  if (Serial) {
     if (spectrumValue[i] < 10)
     {
       Serial.print("   ");
       Serial.print(spectrumValue[i]);
     }
     else if (spectrumValue[i] < 100 )
     {
       Serial.print("  ");
       Serial.print(spectrumValue[i]);
     }
     else
     {
       Serial.print(" ");
       Serial.print(spectrumValue[i]);
     }
   }
}


void flushNode() {

  // pass any incoming bytes from the running node process
  // to the serial port:
  while (nodejs.available()) {
    log(nodejs.read());
  }
  
}

