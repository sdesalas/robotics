float avg = 512.0;

void setup() {
  // put your setup code here, to run once:
  pinMode(A1, INPUT);
  Serial.begin(9600);
  Serial.write("STARTING...");
}

void loop() {
  // put your main code here, to run repeatedly:
  //int sig = analogRead(A1) / 20;
  //String output = "";
  //while(sig-- > 0) output += "*";
  //Serial.println(output);
  int sig = analogRead(A1);
  int diff = sig - avg;
  avg += diff / 10000;
  Serial.print(avg);
  Serial.print("|");
  diff = diff / 10;
  if (diff >=0) 
    while(diff-- > 0) Serial.print("+");
  else
    while(diff++ < 0) Serial.print("-");
  Serial.println();
}
