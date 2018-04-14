
#include <SPI.h>


// Slave

void setup (void)
{
  Serial.begin(115200);   // debugging

  // have to send on master in, *slave out*
  pinMode(MISO, OUTPUT);
  pinMode(17, OUTPUT);
  digitalWrite(17, LOW);

  // turn on SPI in slave mode
  SPCR |= bit(SPE);

  // turn on interrupts
  SPCR |= bit(SPIE);

  // now turn on interrupts
  //SPI.attachInterrupt();

  delay(1000);

  Serial.println("Slave Ready");

}  // end of setup

volatile char buf [20] = "Hello, world!";
volatile int pos;
volatile bool active;

// SPI interrupt routine
ISR (SPI_STC_vect)
{
  Serial.println ("Interrupt!");
  byte c = SPDR;

  if (c == 1)  // starting new sequence?
    {
    active = true;
    pos = 0;
    SPDR = buf [pos++];   // send first byte
    return;
    }

  if (!active)
    {
    SPDR = 0;
    return;
    }

  SPDR = buf [pos];
  if (buf [pos] == 0 || ++pos >= sizeof (buf))
    active = false;
}  // end of interrupt service routine (ISR) SPI_STC_vect

void loop (void)
{
  if (Serial.available()) {
    Serial.print("Pin 17:");
    Serial.println(digitalRead(17));
    while (Serial.available()) {
      Serial.read();
    }
  }
}  // end of loop
