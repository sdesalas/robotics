/*
 * Joystickbot
 * 
 * Direct Joystick-over-serial controller for robot
 * 
 */

const int W1_PWM = 6;
const int W1_DIR = 7;
const int W2_DIR = 8;
const int W2_PWM = 9;
const int X_PIN = 0;
const int Y_PIN = 2;
enum Direction { STILL, FORWARD, BACK, LEFT, RIGHT };

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  pinMode(W1_PWM, OUTPUT);
  pinMode(W1_DIR, OUTPUT);
  pinMode(W2_DIR, OUTPUT);
  pinMode(W2_PWM, OUTPUT);
}

void loop() {
  // put your main code here, to run repeatedly:
  int x = analogRead(X_PIN);
  int y = analogRead(Y_PIN);
  Direction dir = STILL;
  int power = 0;
  if (x >= 300 && x <= 700) {
    if (y >= 300 && y <= 700) {
        dir = STILL;
    } else if (y < 300) {
        dir = LEFT;
        power = map(y, 300, 0, 0, 255);
    } else {
      dir = RIGHT;
      power = map(y, 700, 1024, 0, 255);
    } 
  } else if (x < 300) {
        dir = BACK;
        power = map(x, 300, 0, 0, 255);
  } else {
        dir = FORWARD;
        power = map(x, 700, 1024, 0, 255);
  }

  switch(dir) {
    case FORWARD:
        Serial.print("FORWARD");
        digitalWrite(W1_DIR, HIGH);
        analogWrite(W1_PWM, 255 - power);
        digitalWrite(W2_DIR, HIGH);
        analogWrite(W2_PWM, 255 - power);
      break;
    case BACK:
        Serial.print("BACK");
        digitalWrite(W1_DIR, LOW);
        analogWrite(W1_PWM, power);
        digitalWrite(W2_DIR, LOW);
        analogWrite(W2_PWM, power);
      break;
    case LEFT:
        Serial.print("LEFT");
        digitalWrite(W1_DIR, HIGH);
        analogWrite(W1_PWM, 255 - power);
        digitalWrite(W2_DIR, LOW);
        analogWrite(W2_PWM, power);
      break;
    case RIGHT:
        Serial.print("RIGHT");
        digitalWrite(W1_DIR, LOW);
        analogWrite(W1_PWM, power);
        digitalWrite(W2_DIR, HIGH);
        analogWrite(W2_PWM, 255 - power);
      break;
    default:
        Serial.print("STILL");
        digitalWrite(W1_DIR, LOW);
        analogWrite(W1_PWM, 0);
        digitalWrite(W2_DIR, LOW);
        analogWrite(W2_PWM, 0);
      break;
  }

  Serial.print(power);
  Serial.write("\n");

  delay(100);
}
