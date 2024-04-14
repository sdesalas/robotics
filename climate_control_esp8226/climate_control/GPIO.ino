int ADMIN_LED = 14;

void GPIO_init() {
  // Enable LEDs
  pinMode(BUILTIN_LED, OUTPUT); 
  pinMode(ADMIN_LED, OUTPUT);
  digitalWrite(ADMIN_LED, 0);
  digitalWrite(BUILTIN_LED, 0);
}

// Blink build-in LED n times

void GPIO_blink(int times) {
  GPIO_blink(times, 500);
}

void GPIO_blink(int times, int pause) {
  GPIO_blink(BUILTIN_LED, times, pause);
}

void GPIO_blink(int gpio, int times, int pause) {
  for (int i = 0; i < times; i++)
  {
    digitalWrite(gpio, 0);
    delay(pause/2);
    digitalWrite(gpio, 1);
    delay(pause/2);
  }
}
