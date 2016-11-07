int dustPin=A0;
int ledPower=5;
int dustVal=0,lastDustVal=0;

const int Time280=280, Time40=40, offTime=9680;

float voltage=0, dustDensity = 0,Clow,Chigh;
int Ilow,Ihigh,AQI;

void setup(){
Serial.begin(9600);
pinMode(ledPower,OUTPUT);
Serial.print("DustVal(0~1023)");    //DustVal  Voltage  Density  PPM  AQI
Serial.print("\tVoltage(0~5v)"); 
Serial.print("\tDensity(mg/cm^3)"); 
Serial.println("\tAQI(0~500)"); 
}

void loop(){
dustVal = int(lastDustVal*0.8 + getDustVal()*0.2);    //简单滤波
lastDustVal = dustVal;
voltage = dustVal*(5.0/1023);
dustDensity = 0.17*voltage-0.1;   //
dustDensity = constrain(dustDensity, 0, 0.5004);     
Serial.print(dustVal); Serial.print("\t");
Serial.print(voltage,4);  Serial.print("\t");//Serial.print( "V");
Serial.print(dustDensity,4);Serial.print("\t");//Serial.print("mg/m^3");

if(dustDensity >=0 && dustDensity <=0.0154)           { Clow=0;     Chigh =0.0154;Ilow=0;  Ihigh=50; }
else if(dustDensity >=0.0155 && dustDensity <=0.0404) { Clow=0.0155;Chigh =0.0404;Ilow=51; Ihigh=100;}
else if(dustDensity >=0.0405 && dustDensity <=0.0654) { Clow=0.0405;Chigh =0.0654;Ilow=101;Ihigh=150;}
else if(dustDensity >=0.0655 && dustDensity <=0.1504) { Clow=0.0655;Chigh =0.1504;Ilow=151;Ihigh=200;}
else if(dustDensity >=0.1505 && dustDensity <=0.2504) { Clow=0.1505;Chigh =0.2504;Ilow=201;Ihigh=300;}
else if(dustDensity >=0.2505 && dustDensity <=0.5004) { Clow=0.2505;Chigh =0.5004;Ilow=301;Ihigh=500;}

AQI = (dustDensity-Clow)*(Ihigh-Ilow)/(Chigh-Clow) + Ilow; 

Serial.println(AQI);

delay(3000);

}

int getDustVal(void){
  int Val;
  // ledPower is any digital pin on the arduino connected to Pin 3 on the sensor
  digitalWrite(ledPower,LOW); // power on the LED
  delayMicroseconds(Time280);
  Val=analogRead(dustPin); // read the dust value via pin 5 on the sensor
  delayMicroseconds(Time40);
  digitalWrite(ledPower,HIGH); // turn the LED off
  delayMicroseconds(offTime); 

  return Val;
}
