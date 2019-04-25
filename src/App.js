import React, { Component } from 'react';
import _ from "underscore";

import { format } from "d3-format";

// Pond
import { TimeSeries } from "pondjs";
import './App.css';
import { Map, TileLayer,Marker,  Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Modal from 'react-modal';
import CanvasMarkersLayer from './CanvasMarkersLayer';
import markerIcon from './new-hotel.png';
import states from './states';
import {
  Charts,
  ChartContainer,
  ChartRow,
  YAxis,
  LineChart,
  Resizable,
  Baseline,
  Legend,
  styler
} from "react-timeseries-charts";
import {FaTimes} from 'react-icons/fa';
const position = [33.44896,-112.073]
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
Modal.setAppElement('#root')

const classes = [{name:"0 - 0.9",value:0},{name:"1.0 - 1.9",value:1},{name:"2.0 - 2.9",value:2},{name:"3.0 - 3.9",value:3},{name:"4.0 - 4.9",value:4},{name:"5.0 - 5.9",value:5}]
const months = {"January": 0,"February":1,"March": 2,"April": 3, "May": 4,"June":5,"July":6,"August":7,
"September": 8,"October":9,"November":10,"December":11}
const colors= ["red","blue","green","yellow","black","pink","violet","steelblue","grey","greenyellow"]
class CrossHairs extends React.Component {
    render() {
        const { x, y } = this.props;
        const style = { pointerEvents: "none", stroke: "#ccc" };
        if (!_.isNull(x) && !_.isNull(y)) {
            return (
                <g>
                    <line style={style} x1={0} y1={y} x2={this.props.width} y2={y} />
                    <line style={style} x1={x} y1={0} x2={x} y2={this.props.height} />
                </g>
            );
        } else {
            return <g />;
        }
    }
}
function Comparator(a, b) {
  if (a[0] < b[0]) return -1;
  if (a[0] > b[0]) return 1;
  return 0;
}

class App extends Component {
 
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      items: [],
      filteredItems: [],
      isModalOpen: false,
      curr: null,
      keys:[],
      tracker: null,
      timerange: null,
      x: null,
      y: null,
      stateFilter: '',
      classFilter: '',
      ratingFilter: ''
    };
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }
  openModal() {
    this.setState({isModalOpen: true});
  }
  handleTrackerChanged = tracker => {
    if (!tracker) {
        this.setState({ tracker, x: null, y: null });
    } else {
        this.setState({ tracker });
    }
};

handleTimeRangeChange = timerange => {
    this.setState({ timerange });
};

handleRatingChange(event) {
  let points1 = []
  let {points, columns} = this.state;
  let index =1;
  for(let i=1;i<columns.length;i++){
    if(columns[i]== event.target.value){
      index = i;
    }
  }
  for(let i =0;i< points.length;i++){
     points1.push([points[i][0],points[i][index]]);
  }
  let columns1 = [columns[0],columns[index]];
  let currencySeries = new TimeSeries({
      name: "Ratings",
      columns: columns1,
      points: points1
  });

  this.setState({selectedKey: event.target.value,currencySeries,timerange: currencySeries.range()});
}
handleMouseMove = (x, y) => {
    this.setState({ x, y });
};

  

  closeModal() {
    this.setState({isModalOpen: false,keys:[],curr:null,currencySeries:null,style:null,timerange: null});
  }

 filterHotels(){
   let items = this.state.items;
   let filteredItems=[];
   if(this.state.stateFilter != ''){
      // filteredItems = filteredItems.filter((item) =>{
      //   return (item.address.region === this.state.stateFilter);
      // })
      for(let i =0;i<items.length;i++){
        if(items[i].address.region === this.state.stateFilter){
          filteredItems.push(items[i]);
        }
      }
      //setTimeout(this.setState({isLoaded: true,filteredItems}), 3000);
      //this.setState({isLoaded:false});
      this.setState({filteredItems});
   }
   
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
  onMarkerClick = (e, marker) => {
    let curr = marker[0].data.options.properties;
    fetch("http://localhost:8080/api/review/"+curr['id'])
      .then(res => res.json())
      .then(
        (results) => {
          if(results.length == 0){
            return
          }
          let columns= ["time"]
          let points =[]
          let keys = Object.keys(results[0].ratings);
          columns = columns.concat(keys);
          for(let i =0;i< results.length;i++){
            let po = [];
            let res = results[i];
            let splits = res.date.split(" ");
            let dt = new Date(splits[2],months[splits[0]],parseInt(splits[1].substring(0,splits[1].length-1))).getTime()
            po.push(dt);
            for(let j=0;j<keys.length;j++){
              // if(!res.ratings[keys[j]]){
              //   po.push(0);
              // }else{
                po.push(res.ratings[keys[j]]);
              //}
              
            }
            points.push(po);
          }
          points = points.sort(Comparator);
        let points1 = []
        for(let i =0;i< points.length;i++){
           points1.push([points[i][0],points[i][1]]);
        }
        let columns1 = [columns[0],columns[1]];
        let currencySeries = new TimeSeries({
            name: "Ratings",
            columns: columns1,
            points: points1
        });
   
        let styles=[]
        for(let i = 0;i<keys.length;i++){
          styles.push({key:keys[i],color:"green",width:2})
        }
        let style= styler(styles);
       this.setState({isModalOpen:true,keys:keys,points:points,columns:columns,selectedKey:keys[0],curr,currencySeries,style,timerange: currencySeries.range()});
        },
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      );
  //   let currencySeries = new TimeSeries({
  //     name: "Currency",
  //     columns: ["time", "aud", "euro"],
  //     points: buildPoints()
  // });
  
  // let style = styler([
  //     { key: "aud", color: "steelblue", width: 2 },
  //     { key: "euro", color: "#F68B24", width: 2 }
  // ]);
  
    //this.setState({isModalOpen:true,curr,currencySeries,style,timerange: currencySeries.range()});
  }
  

  render() {
    const f = format(".1f");
    let range = this.state.timerange;
    let categories =[]
    let selectedKey = this.state.selectedKey;
    let stateoptions = states.map((st)=>{
      return(<option key={st.abbreviation} value={st.abbreviation}>{st.name}</option>)
    });
    let classoptions = classes.map((st)=>{
      return(<option key={st.value} value={st.value}>{st.name}</option>)
    });
    let ratingoptions = classes.map((st)=>{
      return(<option key={st.value} value={st.value}>{st.name}</option>)
    });
    if(this.state.timerange){    
      if (this.state.tracker) {
            const index = this.state.currencySeries.bisect(this.state.tracker);
            const trackerEvent = this.state.currencySeries.at(index);
            categories = [{ key:selectedKey, label: selectedKey, value: `${f(trackerEvent.get(selectedKey))}` }];
            // this.state.keys.map((key) =>{
            //   categories.push({ key, label: key, value: `${f(trackerEvent.get(key))}` })
            // })
        }
      }
      let options=[]
      options = this.state.keys.map((key)=>{
        return(<option key={key} value={key}>{key}</option>)
      })
      
    const { error, isLoaded, filteredItems } = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      console.log(filteredItems.length)
      const markers = filteredItems.map((v, i) => {
        let rat=[];
        let dt = new Date().getTime();
        for (let x in v.ratings){
          rat.push( <div key={x}><strong>{x}: </strong><span>{v.ratings[x].toFixed(1)}</span></div>)
        }
        return (<Marker key={i+"_"+dt} position={[v.lat,v.long]} icon={defaultIcon} properties={v}>
        
          <Tooltip>
            <div >
              <div><strong>{v.name}</strong></div>
              <div><strong>RATINGS:</strong></div>
            {rat}
            </div>
          </Tooltip>
        </Marker>);
      });

      //const position = [this.state.lat, this.state.lng]
      let map =<Map center={position} zoom={16} preferCanvas={true} maxBounds={maxBounds} style={{height: '90vh'}}>
        <TileLayer
          attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CanvasMarkersLayer onMarkerClick={(e, marker) => this.onMarkerClick(e, marker)}  dataKey='properties'>
         {markers}
          </CanvasMarkersLayer>
      </Map>
      return (
        <div>
      <div style={{height:"10vh",backgroundColor:"#8C1D40",color:"white"}}>
          <h2 style={{textAlign:"center"}}>HOTEL ADVISOR</h2>
          <h4 style={{paddingLeft:"5px",textAlign:"center"}}>
            <label style={{paddingRight:"10px",marginLeft:"10px"}}>
              Select State:
              <select value={this.state.stateFilter} onChange={(event) => {this.setState({stateFilter:event.target.value})}}>
                {stateoptions}
              </select>
            </label>
            <label style={{paddingRight:"10px",marginLeft:"10px"}}>
              Select Class Range:
              <select value={this.state.classFilter} onChange={(event) => {this.setState({classFilter:event.target.value})}}>
                {classoptions}
              </select>
            </label>
            <label style={{paddingRight:"10px",marginLeft:"10px"}}>
              Select Average Rating Range:
              <select value={this.state.ratingFilter} onChange={(event) => {this.setState({ratingFilter:event.target.value})}}>
                {ratingoptions}
              </select>
            </label>
            <button style={{height:"25px",borderRadius:"5px",backgroundColor:"#8C1D40",color:"white",
            paddingRight:"10px",marginLeft:"10px"}} onClick={() => {this.filterHotels()}}>FILTER</button>
            <button style={{height:"25px",borderRadius:"5px",backgroundColor:"white",color:"#8c1d40",
            paddingRight:"10px",marginLeft:"10px"}} onClick={this.resetHotels}>RESET</button>
          </h4>
      </div>
      {map}
      <Modal
          isOpen={this.state.isModalOpen}
          onRequestClose={this.closeModal}
          style={styles}
          contentLabel="Example Modal"
        >
        {this.state.curr ?
          <div>
          <div className="row">
            <div className="col-md-12">
              <h2 style={{textAlign:"center"}}>{this.state.curr.name}<span style={{float:'right'}}><FaTimes onClick={this.closeModal}/></span></h2>
            </div>
            <div className="col-md-12" style={{marginTop:"20px",marginBottom:"20px",textAlign:"center"}}>
              <h2 style={{textAlign:"center"}}>Ratings History</h2>
            </div>
            <div style={{marginTop:"20px",marginBottom:"20px",textAlign:"center"}} className="col-md-12">
            <label style={{paddingRight:"10px"}}>
          Select Rating Type:
          <select value={this.state.selectedKey} onChange={(event) => {this.handleRatingChange(event)}}>
            {options}
          </select>
        </label>
        </div>
              <div className="col-md-12">
                  <Resizable>
                      <ChartContainer
                          timeRange={range}
                          timeAxisStyle={{
                              ticks: {
                                  stroke: "#AAA",
                                  opacity: 0.25,
                                  "stroke-dasharray": "1,1"
                                  // Note: this isn't in camel case because this is
                                  // passed into d3's style
                              },
                              values: {
                                  fill: "#AAA",
                                  "font-size": 12
                              }
                          }}
                          showGrid={true}
                          paddingRight={100}
                          maxTime={this.state.currencySeries.range().end()}
                          minTime={this.state.currencySeries.range().begin()}
                          timeAxisAngledLabels={true}
                          timeAxisHeight={65}
                          onTrackerChanged={this.handleTrackerChanged}
                           onBackgroundClick={() => this.setState({ selection: null })}
                           enablePanZoom={true}
                          onTimeRangeChanged={this.handleTimeRangeChange}
                          onMouseMove={(x, y) => this.handleMouseMove(x, y)}
                          minDuration={1000 * 60 * 60 * 24}
                      >
                          <ChartRow height="400">
                              <YAxis
                                  id="y"
                                  label="ratings"
                                  min={0}
                                  max={5}
                                  style={{
                                      ticks: {
                                          stroke: "#AAA",
                                          opacity: 0.25,
                                          "stroke-dasharray": "1,1"
                                          // Note: this isn't in camel case because this is
                                          // passed into d3's style
                                      }
                                  }}
                                  width="60"
                                  type="linear"
                                  format=".1f"
                              />
                              <Charts>
                                  <LineChart
                                      axis="y"
                                      breakLine={false}
                                      series={this.state.currencySeries}
                                      columns={[this.state.selectedKey]}
                                      style={this.state.style}
                                      //interpolation="curveBasis"
                                      
                                  />
                                  <CrossHairs x={this.state.x} y={this.state.y} />
                              </Charts>
                          </ChartRow>
                      </ChartContainer>
                  </Resizable>
              </div>
          </div>
          <div className="row">
              <div className="col-md-12">
                  <span>
                      <Legend
                          type="line"
                          align="right"
                          style={this.state.style}
                          highlight={this.state.highlight}
                          onHighlightChange={highlight => this.setState({ highlight })}
                          selection={this.state.selection}
                          onSelectionChange={selection => this.setState({ selection })}
                          categories={
                           categories
                          }
                      />
                  </span>
              </div>
          </div>
      </div>
            :null}
        </Modal>
      </div>

      );
    }
  }
}

const styles = {
content : {
}
}
export default App;
