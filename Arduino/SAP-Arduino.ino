#include <SoftwareSerial.h>
#include <ArduinoJson.h>
#include <dht11.h>
#include "GP2Y1010AU0F.h"
#define DHT11PIN 2
#define PIN_LED 5
#define PIN_OUTPUT A0
#define PIN_PWM A5
#define PIN_BEEP A4
#define PIN_LEDR 11
#define PIN_LEDB 12
#define PIN_LEDG 13
#define FILTER_N 200

GP2Y1010AU0F GP2Y1010AU0F(PIN_LED, PIN_OUTPUT);
SoftwareSerial SoftSerial(8, 9); // RX, TX
dht11 DHT11;
int motor=0;
int mspeed=100;
int aqi=0;
int AQIL=80;
int AQIH=150;
int mode=0;
int t=0;
bool warning = false;
int warning_c = 0;
char data_f='\0';

double getPM() {
  int i;
  double filter_sum = 0.0;
  double filter_max, filter_min;
  double filter_buf[FILTER_N];
  for(i = 0; i < FILTER_N; i++) {
    filter_buf[i] = GP2Y1010AU0F.getOutputV();
    delay(1);
  }
  filter_max = filter_buf[0];
  filter_min = filter_buf[0];
  filter_sum = filter_buf[0];
  for(i = FILTER_N - 1; i > 0; i--) {
    if(filter_buf[i] > filter_max)
      filter_max=filter_buf[i];
    else if(filter_buf[i] < filter_min)
      filter_min=filter_buf[i];
    filter_sum = filter_sum + filter_buf[i];
    filter_buf[i] = filter_buf[i - 1];
  }
  i = FILTER_N - 2;
  filter_sum = filter_sum - filter_max - filter_min + i / 2.0; // +i/2 的目的是为了四舍五入
  filter_sum = filter_sum / i;
  double outputV = filter_sum;
  double ugm3 = GP2Y1010AU0F.getDustDensity(outputV); //计算灰尘浓度
  double aqi = GP2Y1010AU0F.getAQI(ugm3); //计算aqi
  return(aqi);
}

void getTemp () {
  int chk = DHT11.read(DHT11PIN);
  switch (chk)
  {
    case DHTLIB_OK: 
      break;
    case DHTLIB_ERROR_CHECKSUM: 
      Serial.println("Checksum error");
      break;
    case DHTLIB_ERROR_TIMEOUT: 
      Serial.println("Time out error"); 
      break;
    default: 
      Serial.println("Unknown error"); 
      break;
  }
}

void setup() {
  // Open serial communications and wait for port to open:
  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }
  // set the data rate for the SoftwareSerial port
  SoftSerial.begin(9600);
  delay(1000);
  pinMode(PIN_PWM,OUTPUT);
  pinMode(PIN_BEEP,OUTPUT);
  pinMode(PIN_LEDR,OUTPUT);
  pinMode(PIN_LEDB,OUTPUT);
  pinMode(PIN_LEDG,OUTPUT);
  analogWrite(PIN_PWM,100);
  digitalWrite(PIN_BEEP,LOW);
  digitalWrite(PIN_LEDR,HIGH);
  digitalWrite(PIN_LEDB,LOW);
  digitalWrite(PIN_LEDG,HIGH);
}

void loop() { // run over and over
  if (SoftSerial.available()) {
    String msg = SoftSerial.readStringUntil(';');
    StaticJsonBuffer<200> jsonBuffer;
    JsonObject& root = jsonBuffer.parseObject(msg);
    if(root.containsKey("tag")) {
      int tag_t = root["tag"];
      if(tag_t==0){
        digitalWrite(PIN_LEDR,HIGH);
        digitalWrite(PIN_LEDB,HIGH);
        digitalWrite(PIN_LEDG,LOW);
      }else if(tag_t==1){
        digitalWrite(PIN_LEDR,HIGH);
        digitalWrite(PIN_LEDB,LOW);
        digitalWrite(PIN_LEDG,HIGH);
      }
    }
    if(root.containsKey("warning") && root["warning"]==0) {
      warning=!warning;
    }
    if(root.containsKey("mode")) {
      mode = root["mode"];
    }
    if(root.containsKey("motor")) {
      motor = root["motor"];
    }
    if(root.containsKey("speed")) {
      mspeed = root["speed"];
    }
    if(root.containsKey("AQIL")) {
      AQIL = root["AQIL"];
    }
    if(root.containsKey("AQIH")) {
      AQIH = root["AQIH"];
    }
    //sscanf(msg,"C:%d:%d:%d:%d:%d",mode,motor,mspeed,AQIL,AQIH);
    msg="";
    SoftSerial.flush();
    Serial.print("DEBUG|");
    Serial.print("Mode:");
    Serial.print(mode);
    Serial.print("|Motor:");
    Serial.print(motor);
    Serial.print("|Speed:");
    Serial.print(mspeed);
    Serial.print("|AQIL:");
    Serial.print(AQIL);
    Serial.print("|AQIH:");
    Serial.println(AQIH);
  }
  if(!motor) {
    analogWrite(PIN_PWM,0);
  }else{
    analogWrite(PIN_PWM,(int)(mspeed*2.55));
  }
  if(mode){
    if(aqi >= AQIH){
      motor=1;
      int t=aqi-AQIH;
      if(t+100 > 255) t=155;
      mspeed=t+100;
      warning=true;
    }else if(aqi <= AQIL){
      motor=0;
      mspeed=100;
      warning=false;
    }
  }
  if(warning) {
    if(warning_c == 150) {
      int tag = digitalRead(PIN_LEDR) ? 128 : 0;
      analogWrite(PIN_BEEP,tag);
      digitalWrite(PIN_LEDR,!digitalRead(PIN_LEDR));
      digitalWrite(PIN_LEDB,HIGH);
      digitalWrite(PIN_LEDG,HIGH);
      warning_c=0;
    }
    warning_c++;
  }else if (warning_c!=0){
    warning_c=0;
  }
  if (t==300) {
    getTemp();
    char msg_s[128];
    double pm = getPM();
    aqi=(int)pm;
    sprintf(msg_s, "{\"temp\":%d,\"hyd\":%d,\"AQI\":%d}",DHT11.temperature, DHT11.humidity,(int)pm);
    SoftSerial.println(msg_s);
    t=0;
  }else{
    t++;
  }
}

