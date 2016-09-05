
int input = 0;

void setup() {
  // put your setup code here, to run once:
  pinMode(0, INPUT);
  Serial.begin(9600);
}

void loop() {
  // put your main code here, to run repeatedly:
  Serial.println(analogRead(0));
  delay(200);
}
