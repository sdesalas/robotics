#include <arduinoFFT.h>

#define SAMPLES 32             //Must be a power of 2
#define SAMPLING_FREQUENCY 4000 //Hz, must be less than 10000 due to ADC
 
arduinoFFT FFT = arduinoFFT();
 
unsigned int sampling_period_us;
unsigned long microseconds;
 
double vReal[SAMPLES];
double vImag[SAMPLES];
 
void setup() {
    Serial.begin(115200);
 
    sampling_period_us = round(1000000*(1.0/SAMPLING_FREQUENCY));
}
 
void loop() {
   
    /*SAMPLING*/
    for(int i=0; i<SAMPLES; i++)
    {
        microseconds = micros();    //Overflows after around 70 minutes!
     
        vReal[i] = analogRead(A2);
        vImag[i] = 0;
     
        while(micros() < (microseconds + sampling_period_us)){
        }
    }
 
    /*FFT*/
    FFT.Windowing(vReal, SAMPLES, FFT_WIN_TYP_HAMMING, FFT_FORWARD);
    FFT.Compute(vReal, vImag, SAMPLES, FFT_FORWARD);
    FFT.ComplexToMagnitude(vReal, vImag, SAMPLES);
    //double peak = FFT.MajorPeak(vReal, SAMPLES, SAMPLING_FREQUENCY);
 
    /*PRINT RESULTS*/
    //Serial.println(peak);     //Print out what frequency is the most dominant.
 
    for(int i=2; i<(SAMPLES/2); i++)
    {
        //View all these three lines in serial terminal to see which frequencies has which amplitudes
        //Serial.print((i * 1.0 * SAMPLING_FREQUENCY) / SAMPLES, 1);
        //Serial.print(" ");
        //Serial.print("(");
        //Serial.print(vReal[i]);
        //Serial.print(") ");
        
        //Serial.println((int)vReal[i]);                                 // View only this line in serial plotter to visualize the bins
        Serial.write((byte)constrain((int)vReal[i] >> 2, 0, 200));     // This line to send bytes over to serialport in node.js
    }

    Serial.write((byte)255); // next line

        //Serial.print(":");
        //Serial.println(peak);
 
    delay(1);  //Repeat the process every second OR:
    //while(1);       //Run code once
}
