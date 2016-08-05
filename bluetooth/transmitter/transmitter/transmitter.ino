const int X = 0;
const int Y = 2;
const int SW = 7;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  //pinMode(X, INPUT);
  //pinMode(Y, INPUT);
  pinMode(SW, INPUT);
  //digitalWrite(SW, HIGH);
}

void loop() {
  // put your main code here, to run repeatedly:
  Serial.print("Switch: ");
  Serial.print(digitalRead(SW));
  Serial.print("\n");
  Serial.print("X: ");
  Serial.print(analogRead(X));
  Serial.print("\n");
  Serial.print("Y: ");
  Serial.print(analogRead(Y));
  Serial.print("\n");
  delay(300);
}
