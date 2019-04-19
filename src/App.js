import React, { Component, Fragment } from 'react';
import logo from './logo.svg';
import './App.css';
import { Map, TileLayer, ZoomControl,CircleMarker,Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import CanvasMarkersLayer from './CanvasMarkersLayer';
import markerIcon from './new-hotel.png';


const position = [50,-100]
var maxBounds = [
  [5.499550, -167.276413], //Southwest
  [83.162102, -52.233040]  //Northeast
];
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconSize:    [24, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
})

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      items: [],
      filteredItems: []
    };
  }
 
  componentDidMount() {
    fetch("http://localhost:8080/api/offering")
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            items: result,
            filteredItems: result
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }
 
  render() {
    const { error, isLoaded, items } = this.state;
    console.log(this.context);
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      const markers = this.state.items.map((v, i) => {
        return (<Marker key={i} position={[v.lat,v.long]} icon={defaultIcon} properties={v}>
          <Popup>
            <div><strong>num：</strong><span>{i}</span></div>
          </Popup>
        </Marker>);
      });
      //const position = [this.state.lat, this.state.lng]
      
      return (
        <div>
      <Map center={position} zoom={5} preferCanvas={true} maxBounds={maxBounds} style={{height: '750px'}}>
        <TileLayer
          attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
         <CanvasMarkersLayer  dataKey='properties'>
         {markers}
          </CanvasMarkersLayer>
      </Map>
      </div>

      );
    }
  }
}

export default App;
