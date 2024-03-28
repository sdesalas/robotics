// hd44780 library see https://github.com/duinoWitchery/hd44780
// thehd44780 library is available through the IDE library manager
#include <Wire.h>
#include <DS18B20.h>
#include <hd44780.h>                       // main hd44780 header
#include <hd44780ioClass/hd44780_I2Cexp.h> // i2c expander i/o class header

//
const int PIN_TEMP = 7;

hd44780_I2Cexp lcd; // declare lcd object: auto locate & auto config expander chip
DS18B20 ds(PIN_TEMP);

// LCD geometry
const int LCD_COLS = 16;
const int LCD_ROWS = 2;

void setup()
{
   pinMode(LED_BUILTIN, OUTPUT);
   lcd.begin(LCD_COLS, LCD_ROWS);
   lcd.clear();

   for(int i = 0; i < 20; i++) {
       delay(100);
       if (i%2 == 1) lcd.noBacklight();
       else lcd.backlight();
   }
   lcd.backlight();
   lcd.home();
   lcd.print("Hello World");
   delay(2000);
   lcd.setCursor(0, 1);
   lcd.print("Temp ");
}

void loop()
{
   updateLCD();
}

void updateLCD()
{
   static byte onOff = 1;
   static unsigned long lcdTimer = 0;
   unsigned long lcdInterval = 1000;  // update 2 times per second
   if (millis() - lcdTimer >= lcdInterval)
   {
      lcdTimer = millis();
      ds.selectNext()
      lcd.setCursor(6, 1);
      lcd.print("       "); // overwrite old data
      lcd.setCursor(6, 1);  // reset the cursor
      lcd.print(ds.getTempC());
      // Blink the LED 
      if (onOff == 1) {
        onOff = 0;
        // lcd.noBacklight();
      } else {
        onOff = 1;
        // lcd.backlight();
      }
      digitalWrite(LED_BUILTIN, onOff);  
   }
}
