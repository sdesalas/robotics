# Climate control circuit (Fan + Thermostat)

This is a climate control circuit to use external temperature to modulate indoor temperature.

<img src="diagram.explanation.png" width="500"/>

# Components

- 1x Pro Micro ATmega32U4 5V 18Mhz 
- 2x DS18B20 waterproof temperature sensors
- 1x 25W 100mm inline "duct" fan mounted on external air conduit
- 1x 220V relay/octocoupler for 5V circuits
- 1x I2C LCD Screen   

## 1x Pro Micro ATmega32U4 5V 18Mhz 

<img src="promicro.pinout.png" width="400"/>
<img src="promicro2.jpeg" width="400"/>

## 2x DS18B20 waterproof temperature sensors

<img src="tempsensor.png" width="400"/>

## 1x 25W 100mm inline "duct" fan

<img src="fan.jpg" width="400"/>

## 1x 220V relay/octocoupler for 5V circuits

<img src="relaymodule.jpg" width="400"/>

## 1x I2C LCD Screen  

<img src="lcd.front.png" width="400"/>
<img src="lcd.back.png" width="400"/>

# Hookup (LCD)

Its much easier to setup an LCD using I2C, using 2 data cables instead of 6. 

<img src="sensor-lcd.png" width="500"/>

# Hookup (Multi Sensor)

Using the "OneWire" protocol its possible to hook up multiple sensors on the same signal line.

<img src="multi-sensor.png" width="500"/>


