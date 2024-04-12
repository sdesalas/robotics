void GPIO_init() {
  // Enable the built-in LED
  pinMode(BUILTIN_LED, OUTPUT); 
}

// Blink build-in LED n times

void GPIO_blink(int times) {
  GPIO_blink(times, 500);
}

void GPIO_blink(int times, int pause) {
  for (int i = 0; i < times; i++)
  {
    digitalWrite(BUILTIN_LED, 0);
    delay(pause/2);
    digitalWrite(BUILTIN_LED, 1);
    delay(pause/2);
  }
}
