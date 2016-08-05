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

// POSITIVE REINFORCEMENT BUTTON
int buttonPin = 12;
int blueLED = 11;

// WORKING VARIABLES
bool isSound = false;
bool isSoundTm1 = false;
bool isSoundTm2 = false;
bool saveSound = false;
byte savePass = 0;
byte sound[128][7];

void setup() {
  
  Serial.begin(9600); // Initialize the Serial

  setupMSGEQ7();
  setupNAIA();

}

void setupMSGEQ7() {

 pinMode(analogPin, INPUT);
 pinMode(strobePin, OUTPUT);
 pinMode(resetPin, OUTPUT);

 pinMode(greenLED, OUTPUT);
 pinMode(yellowLED, OUTPUT);
 pinMode(redLED, OUTPUT);
 
 analogReference(DEFAULT);

 digitalWrite(greenLED, HIGH);
 digitalWrite(resetPin, LOW);
 digitalWrite(strobePin, HIGH);

}

void setupNAIA() {

  pinMode(blueLED, OUTPUT);
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
  if (Serial) Serial.println("Started process");

  flushNodeOutput();
}


void flushNodeOutput() {

  // pass any incoming bytes from the running node process
  // to the serial port:
  while (nodejs.available()) {
    if (Serial) Serial.write(nodejs.read());
    else nodejs.read();
  }
  
}


void loop() {
  // Is there some output ready (when we are not listening)
  if (nodejs.available() && savePass == 0) {
    loopOUTPUT();
  } else {
    delay(49);
    loopINPUT();
    loopMSGEQ7();
    loopNAIA();
  }
}

void loopINPUT() {

  // Is there a button press?
  if (digitalRead(buttonPin) == HIGH) {

    // Switch blue light 1 sec
    digitalWrite(blueLED, HIGH);
    delay(500);
    digitalWrite(blueLED, LOW);   
    delay(1000);
  }
  
}


void loopMSGEQ7() {

 digitalWrite(resetPin, HIGH);
 digitalWrite(resetPin, LOW);

 for (int i = 0; i < 7; i++)
 {
   digitalWrite(strobePin, LOW);
   delayMicroseconds(30); // to allow the output to settle
   spectrumValue[i] = analogRead(analogPin);
  
   // comment out/remove the serial stuff to go faster
   // - its just here for show
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

   digitalWrite(strobePin, HIGH);
 }

 
}


void loopNAIA() {
  
  // Work out average
  int total = 0;
  int average = 0;
  for (int i = 0; i < 7; i++)
  {
   total += spectrumValue[i];
  }
  average = total / 7;
  if (Serial) {
    Serial.print(" [");
    Serial.print(average);
    Serial.print("] ");
  }
  
  // Do we have sound? (over 25%)
  isSound = false;
  for (int i = 0; i < 7; i++) {
   if (spectrumValue[i] > (average * 1.25))
   {
     if (Serial) Serial.print ("-");
     isSound = true;
   }
  }
  
  // Do we have sound or had sound last pass?
  if (isSound || isSoundTm1 || isSoundTm2) {
   digitalWrite(greenLED, LOW);
   digitalWrite(yellowLED, HIGH);
   if (savePass < 128) {
     for (int i = 0; i < 7; i++) {
       sound[savePass][i] = (spectrumValue[i] / 16) + 48;
     }
     saveSound = true;
     savePass = savePass + 1;
   } else {
     // More than 128 bytes? 
     // save and continue on next batch
     isSound = false;
   }
  } else {
   digitalWrite(yellowLED, LOW);
   // No? Should we save?
   if (saveSound) {
     // Only use if not too small
     if (savePass > 4) {
      digitalWrite(redLED, HIGH);
       unsigned char output[896];
       for (int n = 0; n < savePass && n < 128; n++) {
         for (int i = 0; i < 7; i++) {
           //output[i * n] = sound[n][i];
           nodejs.write((byte)sound[n][i]);
         } 
       }
       nodejs.write((byte)10);
       //nodejs.flush();
       if (Serial) Serial.print(" =saved!");
       flushNodeOutput();
       delay(50);
       digitalWrite(redLED, LOW);
     }
     digitalWrite(greenLED, HIGH);
     // Wipe the saved sound.
     memset(sound, 0, sizeof(sound));
     saveSound = false;
     savePass = 0;
   }
  } 
  
  // Keep track of up to 2 empties.
  isSoundTm1 = isSound;
  isSoundTm2 = isSoundTm1;
  
  if (Serial) Serial.println();
  
}

// Output complete response from nodejs
void loopOUTPUT() {
  digitalWrite(greenLED, LOW);
  while (nodejs.available()) {

    // SOUND: Get 7 byte array from nodejs
    int volume[7];
    int top = 0; int second = 0;
    int total = 0;
    for (int i = 0; i < 7; i++) {
      if (nodejs.available()) {
        // Work out the top and second loudest pitch in this batch
        volume[i] = map(nodejs.read(), 48, 112, 0, 10);
        volume[i] = constrain(volume[i], 0, 10);
        total += volume[i];
        if (volume[i] > volume[top]) {
          second = top;
          top = i;
        }

      }
      //delay(5);
      /*// play at strongest pitch
      //toneAC(pitch[top], output[top], 90);*/
    }
    /*// Each batch has a selection of tone pitch (63Hz to 16KHz) and strength (1-10)
    // Use volume strength to determine duration at each pitch
    for (int i = 0; i < 7; i++) {
      int duration = volume[i] * 120 / total;
      toneAC(pitch[i], volume[i], duration);
    }*/
    // Work out frequency we should be playing at
    int finalPitch = (volume[top] * pitch[top] + volume[second] * pitch[second]) / (volume[top] + volume[second]);
    int finalVolume = constrain(volume[top] + volume[second], 0, 10);
    toneAC(finalPitch, finalVolume, 120);
  }
  // Turn off speaker
  toneAC();
  delay(100);
  digitalWrite(greenLED, HIGH);
}
/*
loopOUTPUTnoDelay() {
  digitalWrite(greenPin, LOW);
  while (nodejs.available()) 
  {
    // SOUND: Get 7 byte array from nodejs
    int output[7];
    for (int i = 0; i < 7; i++) {
      if (nodejs.available()) {
        output[i] = map(nodejs.read(), 48, 112, 0, 10);
      }
    }
  }
  // Turn off speaker
  toneAC();
  delay(100);
  digitalWrite(greenPin, HIGH);
}*/
