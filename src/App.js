import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Map, TileLayer, ZoomControl,Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});
const position = [42, -90];
var maxBounds = [
  [5.499550, -167.276413], //Southwest
  [83.162102, -52.233040]  //Northeast
];
var arr=Array.from({length: 3}, (x,i) => i);
class App extends Component {
  
  render() {
    let markers = arr.map((x) => {
      return <Marker position={[position[0]+5*x,position[1]+5*x]}>
      <Tooltip>
          <span>
            A pretty CSS3 popup. <br/> Easily customizable.
          </span>
      </Tooltip>
    </Marker>
    })
    //const position = [this.state.lat, this.state.lng]
    return (
      <Map center={position} zoom={5} maxBounds={maxBounds} style={{height: '750px'}}>
      <TileLayer
        attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {markers}
    </Map>
    );
  }
}

export default App;
