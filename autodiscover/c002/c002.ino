/* 
 *  CONTROLLER 002 
 *  
 *  By Steven de Salas
 *  
 *  Example of radio control positive/negative feedback 
 *  on auto-discovery microcontroller.
 *  
 *  Uses a protocol to allow USB querying of available 
 *  output (actuator) commands, and examples of the same,
 *  so the upstream microprocessor can act upon them.
 *  
 */
#include "Queue.h";
#include "VirtualWire.h"

FILE serial_stdout;
String command;
struct Tone { long due; int pitch; int duration; };
struct Flash { long due; byte onOff; int duration; };
Queue<Tone> tones = Queue<Tone>(32);
Queue<Flash> reds = Queue<Flash>(32);
Queue<Flash> greens = Queue<Flash>(32);
int currentPitch;

// Inputs
int LIGHT = A5;
int RF_RX = 2;
int RF_LED = 3;

// Outputs
int LED_G = 7;
int LED_R = 4;
int BUZ = 9;

void setup() {
  pinMode(RF_LED, OUTPUT);
  pinMode(LED_G, OUTPUT);
  pinMode(LED_R, OUTPUT);
  pinMode(BUZ, OUTPUT);
  Serial.begin(115200);
  // Set up stdout
  fdev_setup_stream(&serial_stdout, serial_putchar, NULL, _FDEV_SETUP_WRITE);
  stdout = &serial_stdout;
  // Set up radio receiver
  vw_set_rx_pin(RF_RX); 
  vw_setup(2000); // Transmission speed in bits per second.
  vw_rx_start(); // Start the PLL receiver.
  delay(1);
}

void loop() {
  listen();
  interpret();
  act();
  sense();
  delay(500);
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
  short pos; byte batch; byte value; byte duration;
  long due; // When is the command due? used to process batches.
  Flash switch_off; Tone go_quiet;
  switch(command[0]) {

    case '?':
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
      if (command_length < 3) return;
      tones.clear();
      due = millis();
      pos = 2;
      while(pos < command_length) {
        value = command[pos++];
        duration = (command_length == pos) ? 255 : command[pos]; // Max if undefined
        Tone segment = { due, value * 16, duration * 16};
        tones.push(segment);
        due = due + segment.duration;
        pos++; // separator (|)
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
      if (command_length < 3) return;
      ((command[0] == 'G') ? greens : reds).clear();
      due = millis();
      pos = 2;
      while(pos < command_length) {
        value = command[pos++] != 48;
        duration = (command_length == pos) ? 255 : command[pos]; // Max if undefined
        Flash flash = { due, value, duration * 16};
        ((command[0] == 'G') ? greens : reds).push(flash);
        due = due + flash.duration;
        pos++; // separator (|)
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
  Serial.print("g-");
  Serial.println(digitalRead(LED_G));
  Serial.print("l-");
  Serial.println(map(analogRead(LIGHT), 0, 1023, 0, 255)); 
  Serial.print("r-");
  Serial.println(digitalRead(LED_R));
  Serial.print("b-");
  Serial.println(currentPitch);
  Serial.print("w-");
  Serial.println(getRFMessage());
}

String getRFMessage() {

  // Initialize data
  uint8_t buf[VW_MAX_MESSAGE_LEN];
  uint8_t buflen = VW_MAX_MESSAGE_LEN;
  String output = "";

  // Read incoming messages
  if(vw_get_message(buf, &buflen))
  {
    // Message with a good checksum received, dump HEX
    for(int i = 0; i < buflen; ++i)
    {
      output.concat(char(buf[i]));
    }
  }

  if (output.length() > 0) {
    digitalWrite(RF_LED, HIGH);
  } else {
    digitalWrite(RF_LED, LOW);
  }
  
  return output;
}

// Function that printf and related will use to print
int serial_putchar(char c, FILE* f) {
    if (c == '\n') serial_putchar('\r', f);
    return Serial.write(c) == 1? 0 : 1;
}
