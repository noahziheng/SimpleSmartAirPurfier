/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component, PropTypes } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ScrollView,
  IntentAndroid,
  TouchableHighlight,
  Switch,
  Slider,
  Modal,
  ToastAndroid,
  Image
} from 'react-native';
import { Toolbar, Card, Button, COLOR, TYPO } from 'react-native-material-design';
import BluetoothSerial from 'react-native-bluetooth-serial';

export default class SmartAirPurifier extends Component {

  constructor(props) {
    super(props);
    this.state = {
      mode: true,
      connect: false,
      temp: 0,
      hyd: 0,
      AQI: 250,
      AQIL: 80,
      AQIH: 150,
      speed: 100,
      motor: true,
      devices: [],
      date: '',
      modalVisible: false
    };
  }

  componentWillMount () {
      Promise.all([
      BluetoothSerial.isEnabled(),
      BluetoothSerial.list()
    ])
    .then((values) => {
      const [ BTEnabled, devices ] = values
      if(!BTEnabled) {
          BluetoothSerial.enable();
          BluetoothSerial.list().then(
              (devices) => {
                  this.setState({ devices });
              }
          );
      }else{
          this.setState({ devices });
      }
    })
    BluetoothSerial.on('bluetoothEnabled', () => console.log('Bluetooth enabled'))
    BluetoothSerial.on('bluetoothDisabled', () => console.log('Bluetooth disabled'))
    BluetoothSerial.on('connectionLost', () => {
        if(this.state.connect){
            console.log(`Connection to device ${this.state.device.name} has been lost`)
        }
        this.setState({ connect: false })
    })
  }

  _setModalVisible(visible) {
      this.setState({modalVisible: visible});
  }

  _handleDevicesList() {
      if(this.state.connect) {
          BluetoothSerial.write(JSON.stringify({tag:1}));
          BluetoothSerial.disconnect()
          this.setState({connect: false})
      }else {
          this._setModalVisible(true)
      }
  }

  _handleConnect(device) {
      BluetoothSerial.connect(device.id).then(
          (data) => {
              ToastAndroid.show(data.message+'， 正在初始化...', ToastAndroid.LONG)
              sdata = {tag:0,mode:this.state.mode,motor:this.state.motor};
              BluetoothSerial.write(JSON.stringify(sdata)+';');
              setTimeout(() => {  
                sdata = {speed:this.state.speed,AQIL:this.state.AQIL,AQIH:this.state.AQIH};
                BluetoothSerial.write(JSON.stringify(sdata)+';');
                this.setState({connect: true,device: device})
                this._setModalVisible(false)
                BluetoothSerial.subscribe('\n').then(
                    BluetoothSerial.on('data', this._handleData.bind(this))
                )
              },5000);
          },
          (err) => {
              console.log(err)
              ToastAndroid.show(err.message, ToastAndroid.LONG)
          }
      )
  }

  _handleSend (data) {
      if(this.state.connect) {
        this.setState(data)
        BluetoothSerial.write(JSON.stringify(data)+';');
        ToastAndroid.show("指令 " + JSON.stringify(data) + " 已发送", ToastAndroid.LONG);
      }else{
        ToastAndroid.show("需要先连接设备", ToastAndroid.SHORT)
      }
  }

  _handleData (data) {
      data = JSON.parse(data.data);
      console.log(data);
      this.setState(data);
      let date = new Date();
      let dateStr = date.getFullYear() + '/' + date.getMonth() + '/' + date.getDay() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
      this.setState({date: dateStr});
  }

  render() {
    let contents;
    var modalBackgroundStyle = {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    };
    var innerContainerTransparentStyle = {backgroundColor: '#fff', padding: 20};
    var activeButtonStyle = {
      backgroundColor: '#ddd'
    };
    if(this.state.mode) {
        contents = (
            <View style={[].concat({flex: 2},styles.container)}>
                <Slider style={styles.slider} maximumValue={250} step={1} onSlidingComplete={(val) => {this._handleSend({AQIL:val})}} value={this.state.AQIL} />
                <Text>AQI低阈值:{this.state.AQIL}</Text>
                <Slider style={styles.slider} maximumValue={250} step={1} onSlidingComplete={(val) => {this._handleSend({AQIH:val})}} value={this.state.AQIH} />
                <Text>AQI高阈值:{this.state.AQIH}</Text>
            </View>
        )
    }else{
        contents = (
            <View style={[].concat({flex: 2},styles.container)}>
                <Text>风扇开关</Text><Switch onValueChange={(val) => {this._handleSend({motor:val})}} value={this.state.motor} />
                <Slider style={styles.slider} maximumValue={100} step={1} onSlidingComplete={(val) => {this._handleSend({speed:val})}} value={this.state.speed} />
                <Text>风扇转速:{this.state.speed}%</Text>
            </View>
        )
    }
    return (
      <View style={styles.container}>
        <Toolbar title={'智能空气净化器'} />

        <Modal
          animationType={'fade'}
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {this._setModalVisible(false)}}
          >
          <View style={[styles.container, modalBackgroundStyle]}>
            <View style={[styles.innerContainer, innerContainerTransparentStyle]}>
                {this.state.devices.map((val,i) => {
                    return (<Button key={`${val.id}_${i}`} onPress={this._handleConnect.bind(this, val)} style={styles.modalButton} text={val.name} />)
                })}
              <Button onPress={this._setModalVisible.bind(this, false)} style={styles.modalButton} text="关闭" />
            </View>
          </View>
        </Modal>

        <ScrollView style={{backgroundColor: '#fff',marginTop: 60}}>
            <Card>
                <Card.Media
                    image={<Image source={require('./src/img/welcome.jpg')} />} overlay>
                    <Text style={[TYPO.paperFontHeadline, COLOR.paperGrey50].concat({textAlign: 'right'})}>{this.state.connect ? '已连接' : '未连接'}·{this.state.mode ? '智能' : '手动'}模式</Text>
                    <Text style={[TYPO.paperSubhead, COLOR.paperGrey50].concat({textAlign: 'right'})}>上次数据更新时间： {this.state.connect ? this.state.date : 'N/A'}</Text>
                </Card.Media>
                <Card.Body>
                  <View style={styles.itemContainer}>
                    <TouchableHighlight>
                        <View  style={[styles.item]}>
                            <Text style={{fontSize:25}}>{this.state.connect ? this.state.temp+'℃' : 'N/A'}</Text>
                            <Text>温度</Text>
                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight>
                        <View  style={[styles.item]}>
                            <Text style={{fontSize:25}}>{this.state.connect ? this.state.hyd+'%' : 'N/A'}</Text>
                            <Text>湿度</Text>
                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight>
                        <View  style={[styles.item]}>
                            <Text style={{fontSize:25}}>{this.state.connect ? this.state.AQI : 'N/A'}</Text>
                            <Text>AQI</Text>
                        </View>
                    </TouchableHighlight>
                  </View>
                  <View style={styles.itemContainer}>
                    <TouchableHighlight>
                        <View  style={[styles.itemT]}>
                            <Text style={{fontSize:25}}>{this.state.connect ? this.state.motor ? 'ON' : 'OFF' : 'N/A'}</Text>
                            <Text>风扇状态</Text>
                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight>
                        <View  style={[styles.itemT]}>
                            <Text style={{fontSize:25}}>{this.state.connect ? this.state.speed+'%' : 'N/A'}</Text>
                            <Text>风扇转速</Text>
                        </View>
                    </TouchableHighlight>
                  </View>
                </Card.Body>
            </Card>
            <Card>
                <Card.Body>
                    <View>
                        <View style={{flex: 1,flexDirection: 'row',justifyContent: 'center',alignItems: 'center',}}>
                            <Button text={this.state.connect ? '断开连接' : '连接设备'} primary={this.state.connect ? 'googleRed' : 'paperBlue'} raised={true} onPress={this._handleDevicesList.bind(this)} />
                            <Text>智能模式</Text><Switch onValueChange={(val) => {this._handleSend({mode:val})}} value={this.state.mode} />
                        </View>
                            { contents }
                    </View>
                </Card.Body>
            </Card>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  innerContainer: {
    borderRadius: 10,
    alignItems: 'center',
  },
  button: {
    borderRadius: 5,
    flex: 1,
    height: 44,
    alignSelf: 'stretch',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemContainer: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap'
  },
  item: {
      width: 102,
      height: 90,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFF'
  },
  itemT: {
      width: 150,
      height: 90,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFF'
  },
  slider:{  
    height: 50,  
    width: 250,  
  },  
});

const data = {
    text: ['Inbox', 'Sent Items']
};

AppRegistry.registerComponent('SmartAirPurifier', () => SmartAirPurifier);
 