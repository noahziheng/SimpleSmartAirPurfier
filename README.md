# 简约智能空气净化器项目

一个简单的开源空气净化器模型

## 硬件
有关设计资料暂未整理开源，设备连接可从软件部分常量定义中取得，结构组成如下：
- 基于Arduino及其扩展板的核心
- HC-05蓝牙通信模块
- DHT11温湿度传感器(应用了库)
- GP2Y1010AU0F PM2.5传感器(应用了库)
- L298N电机驱动模块
- 淘到的12V/1.5A电机(非全速运行)
- 8.4V锂电池平衡充及自制电源模块

## 软件
应用了Arduino IDE进行软件设计,应用的库放在了Arduino/Library目录,请将这部分库移动到我的文档/Arduino/libraries中后再进行编译。
## APP
直接列出技术栈：
- React Native
- react-native-cli工具
- react-native-bluetooth-serial模块
- react-native-material-design模块

受限于开发条件（没有钱买Mac），目前仅完成安卓部分。

# Simple Smart Air Purfier Project
It's a simple open-source air purifier model.
## Hardware
The documents of hardware isn't open-source now,connection pins can be found in software's DEFINE part,the hardware list: 
- Based on Arduino Core(with EXT-Board)
- HC-05 Bluetooth Module
- DHT11 Tempature&Hyduity Sensor
- GP2Y1010AU0F PM2.5 Sensor
- L298N motor-drive module
- a simple 12V/1.5A fan
- 8.4V power module

## Software
I finish development with Arduino IDE,project depend on some libraries on Arduino/Library folder,Please compile after move these to My Documents/Arduino/libraries.

## APP
Tech-Stack:
- React Native
- react-native-cli Tool
- react-native-bluetooth-serial Module
- react-native-material-design Module

Android Only!!!(Because I'm poor for Mac)

