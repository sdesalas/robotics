/* 
 *  CONTROLLER 001 
 *  
 *  By Steven de Salas
 *  
 *  Example of alternative to firmata for allowing upstream
 *  serial control over arduino microcontroller.
 * 
 *  Uses a protocol to allow USB querying of available 
 *  output (actuator) commands, and examples of the same,
 *  so the upstream microprocessor can act upon them.
 *  
 */
#include "Queue.h";

FILE serial_stdout;
String command;
struct Tone { long due; short pitch; short duration; };
Queue<Tone> tones = Queue<Tone>(32);
long due = millis(); 

int LED = 4;
int BUZ = 9;

void setup() {
  Serial.begin(115200);
  // Set up stdout
  fdev_setup_stream(&serial_stdout, serial_putchar, NULL, _FDEV_SETUP_WRITE);
  stdout = &serial_stdout;
}

void loop() {
  query();
  act();
  delayact();
  sense();
  delay(100);
}

// Reads 1 line from USB Serial
void query() {
  // Read line
  char chr;
  command = "";
  while(Serial && Serial.available()) {
      chr = Serial.read();
      if (chr == 10) break; // exit on new line
      else command.concat(chr);
  }
  //command.trim();
}

void act() {
  // Process latest command
  int command_length = command.length();
  if (command_length < 1) return;
  Serial.print(command);
  randomSeed(micros());
  short pos; byte batch; 
  if (due < millis()) due = millis(); // When is the command due? used to process batches.
  switch(command[0]) {
    case 'H': // Help
      if (command_length < 3) {
        // List available commands
        Serial.println(":B,L");
        return; 
      };
      // Show example
      switch(command[2]) {
        case 'B': // Buzzer Example
          batch = random(1, 5);
          for (int i = 0; i < batch; i++) {
            if (i > 0) { Serial.print('|'); }
            Serial.write(random(0, 255));
            Serial.write(random(0, 255));
          }
          Serial.println(); 
          return;
        case 'L': // LED Example
          printf("%d", random(0, 2));
          Serial.println(); 
          return;
      }
      return;
    case 'B': // Buzzer
      if (command_length < 4) return;
      for (pos = 2; pos < command_length; pos = pos + 3) {
        if (command_length < pos + 2) return;
        Tone segment = { due, command[pos] * 16, command[pos+1] * 16};
        tones.push(segment);
        due = due + segment.duration;
      }
      Serial.println(":OK");
      return;
    case 'L': // LED
      if (command_length < 3) return;
      digitalWrite(LED, command[2] == 49 ? HIGH : LOW);
      Serial.println(":OK");
      return;
    default:
      Serial.println(":ERR");
      return;
  }
}

void delayact() {
  if (tones.count()) {
    Tone delayedtone = tones.pop(true);
    if (delayedtone.due < millis()) { // Is it due?
      delayedtone = tones.pop();
      printf("Acting on delay, %d items left", tones.count());
      Serial.println();
      tone(BUZ, delayedtone.pitch, delayedtone.duration);
    }
  }
}

void sense() {
  // Light Sensor
  Serial.print("l:");
  Serial.println(map(analogRead(A5), 0, 1023, 0, 255)); 
}

// Function that printf and related will use to print
int serial_putchar(char c, FILE* f) {
    if (c == '\n') serial_putchar('\r', f);
    return Serial.write(c) == 1? 0 : 1;
}
