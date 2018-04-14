/* 
 *  CONTROLLER 003
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
struct Move { long due ; char dir; };
Queue<Move> moves = Queue<Move>(32);

// Inputs
int RF_RX = 6;
int RF_LED = 17;

// Outputs
int SERVO_L = 3;
int SERVO_R = 5;

void setup() {
  pinMode(RF_LED, OUTPUT);
  pinMode(SERVO_L, OUTPUT);
  pinMode(SERVO_R, OUTPUT);
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
}

void interpret() {
  // Process latest command
  int command_length = command.length();
  if (command_length < 1) return;
  Serial.print(command);
  randomSeed(micros());
  short pos; byte batch; byte value; byte duration;
  long due; // When is the command due? used to process batches.
  Move stand_still;
  switch(command[0]) {

    case '?':
      //
      // Help - List Available commands
      //
      if (command_length < 3) {
        Serial.println(">W");
        return;
      };

      // Provide examples
      switch(command[2]) {

        case 'W':
          //
          // Wheel Example
          //
          batch = random(1, 5);
          for (int i = 0; i < batch; i++) {
            if (i > 0) { Serial.print('|'); }
            switch(random(0, 3)) {
              case 0: Serial.write('F');
                break; 
              case 1: Serial.write('B');
                break; 
              case 2: Serial.write('R');
                break; 
              case 3: Serial.write('L');
                break; 
            }
            Serial.write(random(0, 9));
          }
          Serial.println(); 
          return;

      }
      return;

    case 'W':
      // 
      // Wheel HAL
      // 
      // See example: 
      //
      // W:F8|R2 // ie. W:[char `direction`][byte `distance`]|[char `direction`][byte `distance`]|...
      //
      if (command_length < 3) return;
      moves.clear();
      due = millis();
      pos = 2;
      while(pos < command_length) {
        value = command[pos++];
        duration = (command_length == pos) ? 255 : command[pos]; // Max if undefined
        while(duration > 0) {
          moves.push((Move){ due, value });
          due += 50;
          duration--;
        }
        pos++; // separator (|)
      }
      moves.push({ due, '-' }); // stop
      Serial.println("--OK");
      return;
  }
}

void act() {
  if (moves.count()) {
    Move delayedmove = moves.peek();
    if (delayedmove.due < millis()) { // Is it due?
      delayedmove = moves.pop();
      printf("Acting on delay, %d items left", moves.count());
      Serial.println();
      switch(delayedmove.dir) {
        case 'F': // Forward
          analogWrite(SERVO_L, 254);
          analogWrite(SERVO_R, 50);
          break;
        case 'B': // Back
          analogWrite(SERVO_L, 50);
          analogWrite(SERVO_R, 254);
          delay(80);
          break;
        case 'R': // Right
          analogWrite(SERVO_L, 0);
          analogWrite(SERVO_R, 50);
          break;
        case 'L': // Left
          analogWrite(SERVO_L, 254);
          analogWrite(SERVO_R, 0);
          break;
        default: // Stop
          analogWrite(SERVO_L, 0);
          analogWrite(SERVO_R, 0);
      }
    }
  }
}

void sense() {
  // Radio Sensor
  Serial.print("w>");
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
    digitalWrite(RF_LED, !HIGH);
    byte iterations = (byte)output[1];
    long due = millis();
    while(iterations > 0) {
      moves.push((Move){due: due, dir: output[0]});
      due += 50;
      iterations--;
    }
    moves.push({due: due, dir: '-'}); // Stop
  } else {
    digitalWrite(RF_LED, !LOW);
  }
  
  return output;
}

// Function that printf and related will use to print
int serial_putchar(char c, FILE* f) {
    if (c == '\n') serial_putchar('\r', f);
    return Serial.write(c) == 1? 0 : 1;
}

