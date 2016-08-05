/*Suitable for 433MHz Remote Kit and 315MHz Remote Kit */

#include <VirtualWire.h>
 
int RF_TX_PIN = 5;//connect the sent module to D12 to use  
              //you can change it to the idle port you want. 
 
void setup()
{
  Serial.begin(19200);
  pinMode(9, OUTPUT);
  vw_set_tx_pin(RF_TX_PIN); // Setup transmit pin
  vw_set_ptt_inverted(true); // Transmit on low
  vw_setup(2000); // Transmission speed in bits per second.
}

void loop()
{
  digitalWrite(9, HIGH);
  const char *msg = "hello";
  vw_send((uint8_t *)msg, strlen(msg));  // Send 'hello' every 400ms.
  delay(200);
  digitalWrite(9, LOW);
  delay(1000);
 
}


