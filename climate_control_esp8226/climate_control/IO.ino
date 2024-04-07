
const int T48H_n = 12*48;
short T48H_inside[T48H_n];
short T48H_outside[T48H_n];
byte T48H_onoff[T48H_n];
const int T7D_n = 4*24*7;
short T7D_inside[T7D_n];
short T7D_outside[T7D_n];
byte T7D_onoff[T7D_n];

void IO_init() {
  // Enable the built-in LED
  pinMode(BUILTIN_LED, OUTPUT); 
  // Initialize the buffers 
  for(int i = 0; i < T48H_n; i++) {
    T48H_inside[i] = 2000;
    T48H_outside[i] = 1500;
    T48H_onoff[i] = 0;
  }
  for(int i = 0; i < T7D_n; i++) {
    T7D_inside[i] = 2000;
    T7D_outside[i] = 1500;
    T7D_onoff[i] = 0;
  }
}

// Blink build-in LED n times

void IO_blink(int times) {
  IO_blink(times, 500);
}

void IO_blink(int times, int pause) {
  for (int i = 0; i < times; i++)
  {
    digitalWrite(BUILTIN_LED, 0);
    delay(pause/2);
    digitalWrite(BUILTIN_LED, 1);
    delay(pause/2);
  }
}
