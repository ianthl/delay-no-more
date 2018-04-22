import { TimePicker } from 'antd';
import moment from 'moment';
import React, { Component } from 'react';
import 'antd/dist/antd.css'; 

class MyTimePicker extends Component{
    constructor(){
        super();
        this.state = {
            value: null, 
        };
    }

    onChange = (time, timeString) => {
        console.log("Time: " + time);
        console.log("Time String: " + timeString);
        this.setState({value: time,});
        timeString = "00:" + timeString;
        this.props.bufferTime(timeString);
        // if (this.props.wtime === 1){
        //     this.props.bufferTime(timeString);
        // } else if (this.props.wtime === 2){
        //     this.props.minDailyTime(timeString);
        // }
    }

    render(){
        return(
            <div style={{paddingLeft:"280px", paddingTop:"25px", paddingBottom:"25px"}}>
                <TimePicker defaultValue={moment('00:00', 'mm:ss')} format={'mm:ss'} value={this.state.value} onChange={this.onChange} minuteStep={5} secondStep={10} size="large" />
            </div>
        );
    }
}

export default MyTimePicker; 