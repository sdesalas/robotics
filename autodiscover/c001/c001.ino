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
struct Tone { long due; int pitch; int duration; };
struct Flash { long due; byte onOff; int duration; };
Queue<Tone> tones = Queue<Tone>(32);
Queue<Flash> reds = Queue<Flash>(32);
Queue<Flash> greens = Queue<Flash>(32);
int currentPitch;

// Inputs
int LIGHT = 5;

// Outputs
int LED_G = 7;
int LED_R = 4;
int BUZ = 9;

void setup() {
  pinMode(LED_G, OUTPUT);
  pinMode(LED_R, OUTPUT);
  pinMode(BUZ, OUTPUT);
  Serial.begin(115200);
  // Set up stdout
  fdev_setup_stream(&serial_stdout, serial_putchar, NULL, _FDEV_SETUP_WRITE);
  stdout = &serial_stdout;
}

void loop() {
  listen();
  interpret();
  act();
  sense();
  delay(100);
}

// Reads 1 line from USB Serial
void listen() {
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

void interpret() {
  // Process latest command
  int command_length = command.length();
  if (command_length < 1) return;
  Serial.print(command);
  randomSeed(micros());
  short pos; byte batch; 
  long due; // When is the command due? used to process batches.
  Flash switch_off; Tone go_quiet;
  switch(command[0]) {

    case 'H':
      // 
      // Help - List Available commands
      //
      if (command_length < 3) {
        Serial.println("-B|R|G");
        return; 
      };
      
      // Provide examples
      switch(command[2]) {

        case 'B': 
          //
          // Buzzer Example
          //
          batch = random(1, 5);
          for (int i = 0; i < batch; i++) {
            if (i > 0) { Serial.print('|'); }
            Serial.write(random(0, 255));
            Serial.write(random(0, 255));
          }
          Serial.println(); 
          return;

        case 'R':
        case 'G': 
          // 
          // Red/Green LED Example
          //
          batch = random(1, 5);
          for (int i = 0; i < batch; i++) {
            if (i > 0) { Serial.print('|'); }
            Serial.write(random(48, 50));
            Serial.write(random(0, 255));
          }
          Serial.println(); 
          return;
      }
      return;

    case 'B':
      // 
      // Buzzer HAL
      // 
      // See example: note that `tone` is in Hz. `duration` is 0-255 x16 milliseconds (ie max 4096ms)
      //
      // B:u4|;0 // ie. B:[byte `tone`][byte `duration`]|[byte `tone`][byte `duration`]|...
      //
      if (command_length < 4) return;
      tones.clear();
      due = millis();
      for (pos = 2; pos < command_length; pos = pos + 3) {
        if (command_length < pos + 2) return;
        Tone segment = { due, command[pos] * 16, command[pos+1] * 16};
        tones.push(segment);
        due = due + segment.duration;
      }
      go_quiet = { due, 0, 1 };
      tones.push(go_quiet);
      Serial.println("--OK");
      return;

    case 'R':
    case 'G':
      // 
      // Red/Green LED HAL
      //
      // See example: note that `duration` is 0-255 x16 milliseconds (ie max 4096ms)
      //
      // R:1y|0G|1n // ie. R:[0/1][byte duration]|[0/1][byte duration]|...
      //
      if (command_length < 4) return;
      due = millis();
      ((command[0] == 'G') ? greens : reds).clear();
      for (pos = 2; pos < command_length; pos = pos + 3) {
        if (command_length < pos + 2) return;
        Flash flash = { due, command[pos] != 48, command[pos+1] * 16};
        ((command[0] == 'G') ? greens : reds).push(flash);
        due = due + flash.duration;
      }
      switch_off = { due, 0, 0 };
      ((command[0] == 'G') ? greens : reds).push(switch_off); // Turn off when finished
      Serial.println("--OK");
      return;
    default:
      Serial.println("--ERR");
      return;
  }
}

void act() {
  if (tones.count()) {
    Tone delayedtone = tones.peek();
    if (delayedtone.due < millis()) { // Is it due?
      delayedtone = tones.pop();
      //printf("Acting on delay, %d items left", tones.count());
      Serial.println();
      tone(BUZ, delayedtone.pitch, delayedtone.duration);
      currentPitch = delayedtone.pitch;
    }
  }

  if (greens.count()) {
    Flash flash = greens.peek();
    if (flash.due < millis()) {
      flash = greens.pop();
      //printf("Acting on delay, %d items left", greens.count());
      Serial.println();
      digitalWrite(LED_G, flash.onOff);
    }
  }

  if (reds.count()) {
    Flash flash = reds.peek();
    if (flash.due < millis()) {
      flash = reds.pop();
      //printf("Acting on delay, %d items left", reds.count());
      Serial.println();
      digitalWrite(LED_R, flash.onOff);
    }
  }
}

void sense() {
  // Light Sensor
  Serial.print("l-");
  Serial.println(map(analogRead(LIGHT), 0, 1023, 0, 255)); 
  Serial.print("g-");
  Serial.println(digitalRead(LED_G));
  Serial.print("r-");
  Serial.println(digitalRead(LED_R));
  Serial.print("b-");
  Serial.println(currentPitch);
}

// Function that printf and related will use to print
int serial_putchar(char c, FILE* f) {
    if (c == '\n') serial_putchar('\r', f);
    return Serial.write(c) == 1? 0 : 1;
}
