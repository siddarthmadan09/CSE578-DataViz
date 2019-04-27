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
import TagCloud from 'react-tag-cloud';
import randomColor from 'randomcolor';



//text cloud font limits
const fontMin = 30;
const fontMax = 60;
const rotarray = [0,90]

//init position
const position = [33.44896,-112.073]

//map bounds
const maxBounds = [
  [5.499550, -167.276413], //Southwest
  [83.162102, -52.233040]  //Northeast
];

//Marker Icon
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconSize:    [24, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
})

Modal.setAppElement('#root')

//Filter values
const classes = [{name:"",value:''},{name:"0 - 0.9",value:0},{name:"1.0 - 1.9",value:1},{name:"2.0 - 2.9",value:2},{name:"3.0 - 3.9",value:3},{name:"4.0 - 4.9",value:4},{name:"5.0",value:5}]
const months = {"January": 0,"February":1,"March": 2,"April": 3, "May": 4,"June":5,"July":6,"August":7,
"September": 8,"October":9,"November":10,"December":11}


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

  //filter hotels based on choice
  filterHotels(){
    let filteredItems = this.state.items;
    if(this.state.stateFilter != ''){
      filteredItems = filteredItems.filter((item) => {
        return (item.address.region === this.state.stateFilter);
      });  
    }
    console.log(filteredItems.length);

   
    
    if(this.state.classFilter != ''){
      filteredItems = filteredItems.filter((item) => {
        let c = parseFloat(item['hotel_class']);
        return (c >= parseInt(this.state.classFilter) && c < parseInt(this.state.classFilter)+1);
      });  
    }
    console.log(filteredItems.length);
    if(this.state.ratingFilter != ''){
      filteredItems = filteredItems.filter((item) => {
        let sum = 0;
        let count =0;
        for(let it in item.ratings){
          sum += parseFloat(item.ratings[it]);
          count += 1;
        } 
        let avg = parseFloat(sum)/parseFloat(count);
        return (avg >= parseInt(this.state.ratingFilter) && avg < parseInt(this.state.ratingFilter)+1);
      });  
    }
    console.log(filteredItems.length);
    this.setState({filteredItems});
  }

  //reset the filters
  resetHotels(){
    this.setState({filteredItems:this.state.items,ratingFilter:'',stateFilter:'',classFilter:''});
  }

  componentDidMount() {
   fetch("http://hoteladvisor.xyz:8080/api/offering")
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            items: result,
            filteredItems: result
          });
        },
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
    fetch("http://hoteladvisor.xyz:8080/api/review/"+curr['id'])
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
              po.push(res.ratings[keys[j]]);  
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
  
  }
  

  render() {
   
    let range = this.state.timerange;
    let {curr, selectedKey} = this.state
    let categories = [{ key:selectedKey, label: selectedKey}];
    let text =[]
    if(curr){
      let min  = Math.min.apply(Math, curr['positive'].map(function(o) { return o.count; }));
      let max = Math.max.apply(Math, curr['positive'].map(function(o) { return o.count; }));
      if(Math.max.apply(Math, curr['negative'].map(function(o) { return o.count; })) > max){
        max = Math.max.apply(Math, curr['negative'].map(function(o) { return o.count; }));
      }
      if(Math.min.apply(Math, curr['negative'].map(function(o) { return o.count; })) < min){
        min = Math.min.apply(Math, curr['negative'].map(function(o) { return o.count; }));
      }
      for(let key in curr.positive){
        let k = Math.floor(Math.random() * rotarray.length);
        while(k == rotarray.lentgh){
          k = Math.floor(Math.random() * rotarray.length)
        }
        let dt = new Date().getTime();
        let count = parseInt(curr['positive'][key]['count']);
        console.log( max)
        let size = (count == min) ? fontMin
        : ((count / max) * (fontMax - fontMin)) + fontMin;
        console.log(size);
        text.push(
          
          <div
              key ={dt+"_"+key}
              style={{
                fontFamily: 'serif',
                fontWeight: 'bold',
                color: 'green',
                fontSize: size
              }} rotate={rotarray[k]}>{curr['positive'][key]['word']}
            </div>
        )
      } 
      for(let key in curr.negative){
        let k = Math.floor(Math.random() * rotarray.length);
        while(k == rotarray.lentgh){
          k = Math.floor(Math.random() * rotarray.length)
        }
        let dt = new Date().getTime();
        text.push(
          <div
          key ={dt+"_"+key}
              style={{
                fontFamily: 'serif',
                fontWeight: 'bold',
                color: 'red',
              }}
              rotate={rotarray[k]}>
              {curr['negative'][key]['word']}
            </div>
        )
      } 
    }
    let stateoptions = states.map((st)=>{
      return(<option key={st.abbreviation} value={st.abbreviation}>{st.name}</option>)
    });
    let classoptions = classes.map((st)=>{
      return(<option key={st.value} value={st.value}>{st.name}</option>)
    });
    let ratingoptions = classes.map((st)=>{
      return(<option key={st.value} value={st.value}>{st.name}</option>)
    });
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
            paddingRight:"10px",marginLeft:"10px"}} onClick={() => this.resetHotels()}>RESET</button>
          </h4>
      </div>
      
      {/*Map*/}
      <Map center={position} zoom={16} preferCanvas={true} maxBounds={maxBounds} style={{height: '90vh'}}>
        <TileLayer
          attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CanvasMarkersLayer onMarkerClick={(e, marker) => this.onMarkerClick(e, marker)}  dataKey='properties'>
         {markers}
          </CanvasMarkersLayer>
      </Map>

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
              <h2 style={{textAlign:"center",color:"#8C1D40"}}>{this.state.curr.name}<span style={{float:'right'}}><FaTimes onClick={this.closeModal}/></span></h2>
            </div>
            <div className="col-md-12" style={{marginTop:"20px",marginBottom:"20px",textAlign:"center"}}>
              <h2 style={{textAlign:"center",color:"#8C1D40"}}>Ratings History</h2>
            </div>
            <div style={{marginTop:"20px",marginBottom:"20px",textAlign:"center"}} className="col-md-12">
              <label style={{paddingRight:"10px",color:"#8C1D40"}}>
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
                        onBackgroundClick={() => this.setState({ selection: null })}
                        onTimeRangeChanged={this.handleTimeRangeChange}
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
                              />
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
          <div className="row">
            <div className="col-md-12" style={{marginTop:"20px",marginBottom:"20px",textAlign:"center"}}>
              <h2 style={{textAlign:"center",color:"#8C1D40"}}>Opinion Cloud</h2>
            </div>
            <div className="col-md-12">
              <div className="app-outer">
                <div className="app-inner">
                  <TagCloud 
                    className='tag-cloud'
                    style={{
                      fontFamily: 'sans-serif',
                      padding: 5,
                      height: '900px',
                    width:'100%'
                    }}>
                      {text}
                  </TagCloud>
                </div>
              </div>
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

}
export default App;
