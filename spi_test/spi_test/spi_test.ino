
// master

#include <SPI.h>

void setup (void)
{
  Serial.begin (115200);
  Serial.println ("Starting");

  digitalWrite(SS, HIGH);  // ensure SS stays high for now

  // Put SCK, MOSI, SS pins into output mode
  // also put SCK, MOSI into LOW state, and SS into HIGH state.
  // Then put SPI hardware into Master mode and turn SPI on
  SPI.begin ();

  // Slow down the master a bit
  SPI.setClockDivider(SPI_CLOCK_DIV8);

}  // end of setup

void loop (void)
{
  char buf [20];

  // enable Slave Select
  digitalWrite(SS, LOW);    
  SPI.transfer (1);   // initiate transmission
  for (int pos = 0; pos < sizeof (buf) - 1; pos++)
    {
    delayMicroseconds (15);
    buf [pos] = SPI.transfer (0);
    if (buf [pos] == 0)
      {
      break;
      }
    }

  buf [sizeof (buf) - 1] = 0;  // ensure terminating null

  // disable Slave Select
  digitalWrite(SS, HIGH);

  Serial.print ("We received: ");
  Serial.println (buf);

  delay (1000);  // 1 second delay 
}  // end of loop
