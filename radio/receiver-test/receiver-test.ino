/*Suitable for 433MHz Remote Kit and 315MHz Remote Kit by CATALEX Team*/
//Store: http://www.aliexpress.com/store/1199788
//      http://dx.com

#include <VirtualWire.h>
 
int RF_RX_PIN = 11;//connect the sent module to D11 to use  
              //you can change it to the idle port you want. 

 
void setup()
{
  Serial.begin(9600);
  Serial.println("setup");
  pinMode(13, OUTPUT);
  vw_set_rx_pin(RF_RX_PIN);  // Setup receive pin.
  vw_setup(2000); // Transmission speed in bits per second.
  vw_rx_start(); // Start the PLL receiver.
}
 
void loop()
{
  String comdata = "";
  uint8_t buf[VW_MAX_MESSAGE_LEN];
  uint8_t buflen = VW_MAX_MESSAGE_LEN;
  if(vw_get_message(buf, &buflen)) // non-blocking I/O
  {
    int i;
    // Message with a good checksum received, dump HEX
    Serial.print("Got: ");
   
    for(i = 0; i < buflen; ++i)
    {
      comdata += (char)buf[i];
      //Serial.print(" ");
    //Serial.print(buf[i]);
    }
    Serial.print(comdata);
    Serial.println("");
  }

  //Serial.println("next pass..");
  //delay(1000);
  digitalWrite(13, millis() % 400 < 200);
}


