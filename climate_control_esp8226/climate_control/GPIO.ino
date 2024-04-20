// Include the required Arduino libraries:
#include "OneWire.h"
#include "DallasTemperature.h"

#define GPIO_ONE_WIRE_BUS 4 // (GPIO4 = D2)
#define GPIO_RED_LED 14 // (GPIO14 = D5)
#define GPIO_BLUE_LED (BUILTIN_LED) // TODO: (GPIO13 = D7)
#define GPIO_FAN_RELAY 5 // (GPIO5 = D1)

// Pass the oneWire reference to DallasTemperature library:
OneWire gpio_oneWire(GPIO_ONE_WIRE_BUS);
DallasTemperature gpio_sensors(&gpio_oneWire);
int gpio_device_count;

void GPIO_init() {
  Serial.print("GPIO_init()");
  // Initialize Pins
  pinMode(GPIO_BLUE_LED, OUTPUT); 
  pinMode(GPIO_RED_LED, OUTPUT);
  pinMode(GPIO_FAN_RELAY, OUTPUT);
  digitalWrite(GPIO_RED_LED, 0);
  digitalWrite(GPIO_BLUE_LED, 0);
  digitalWrite(GPIO_FAN_RELAY, 0);
  // Initialize sensors
  gpio_sensors.begin();
  // Locate the devices on the bus:
  Serial.println("Locating devices.");
  Serial.print("-> ");
  gpio_device_count = gpio_sensors.getDeviceCount();
  Serial.print(gpio_device_count);
  Serial.print(" devices");
  delay(1000);
}

void GPIO_blink(int times) {
  GPIO_blink(times, 500);
}

void GPIO_blink(int times, int pause) {
  GPIO_blink(GPIO_BLUE_LED, times, pause);
}

void GPIO_blink(int pin, int times, int pause) {
  for (int i = 0; i < times; i++)
  {
    digitalWrite(pin, 0);
    delay(pause/2);
    digitalWrite(pin, 1);
    delay(pause/2);
  }
}

void GPIO_collect(struct Metric& metric) {
  // Send OneWire command for all devices on the bus to perform a temperature conversion:
  gpio_sensors.requestTemperatures();

  // Collect temperature from each sensor
  int outsideSensor = setting_fan_sensorswap ? 1 : 0;
  int insideSensor = setting_fan_sensorswap ? 0 : 1;
  for (int i = 0;  i < gpio_device_count;  i++) {
    if (i == outsideSensor) {
      Serial.print("Out:");
      metric.outside = gpio_sensors.getTempCByIndex(i);
      Serial.print(int(round(metric.outside)));
      Serial.print("C");
    }
    if (i == insideSensor) {
      Serial.print("In:");
      metric.inside = gpio_sensors.getTempCByIndex(i);
      Serial.print(int(round(metric.inside)));
      Serial.print("C");
      if (metric.inside > setting_fan_hot) Serial.print(" ! ");
      if (metric.inside < setting_fan_cold) Serial.print(" * ");
    }
    Serial.print(" | ");
  }

  // Is it too hot inside, and cooler outside?
  if (metric.inside > setting_fan_hot && metric.outside < metric.inside - setting_fan_buffer) {
    Serial.print("Warm in, cold out.");
    metric.fan = 1;
  }
  // Is it too cold inside, and warmer outside?
  else if (metric.inside < setting_fan_cold && metric.outside > metric.inside + setting_fan_buffer) {
    Serial.print("Cold in, warm out.");
    metric.fan = 1;
  }
  // No? Then turn fan off.
  else {
    Serial.print("Same same.");
    metric.fan = 0;
  }

  // Send signal
  digitalWrite(GPIO_FAN_RELAY, metric.fan);
  Serial.println(metric.fan == 1 ? " ON" : " OFF");
}
