import React, { Component } from 'react';
import ShopPanel from './ShopPanel';

import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from 'material-ui/Toolbar';
import { Tabs, Tab } from 'material-ui/Tabs';
import SwipeableViews from 'react-swipeable-views';
import FlatButton from 'material-ui/FlatButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import Dialog from 'material-ui/Dialog';
import Snackbar from 'material-ui/Snackbar';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faSeedling from '@fortawesome/fontawesome-free-solid/faSeedling';
import faSun from '@fortawesome/fontawesome-free-solid/faSun';
import faFire from '@fortawesome/fontawesome-free-solid/faFire';
import faMoneyBillAlt from '@fortawesome/fontawesome-free-solid/faMoneyBillAlt';
import faStar from '@fortawesome/fontawesome-free-solid/faStar';

import firebase from '../firebase';
const auth = firebase.auth();
const db = firebase.database();

/* global google */

class Shop extends Component {
  constructor() {
    super();
    this.state = {
      user: {
        totalEarning: 0
      },
      shop: {
        0: {category: 0, name: "Fertilizer", description: "Wage +10% (One Day)", price: 5, isPremium: false, imgSrc: null},
        1: {category: 0, name: "Super Fertilizer", description: "Wage + 100% (One Day)", price: 2, isPremium: true, sku: 5, imgSrc: null},
        2: {category: 0, name: "Monopoly", description: "Wage + 80 (One Day)", price: 5, isPremium: true, sku: 6, imgSrc: null},
        3: {category: 0, name: "Alarm System", description: "Robbery chance -50% (Permanently)", price: 350, isPremium: false, imgSrc: null},
        4: {category: 0, name: "Rainwater Harvesting System", description: "No more Drought (Permanently)", price: 500, isPremium: false, imgSrc: null},
        5: {category: 3, name: "A Gold Bar", description: "+ $50", price: 9.99, isPremium: true, imgSrc: null, sku: 4, amount: 50},
        6: {category: 3, name: "Chest of Gold", description: "+ $150", price: 19.99, isPremium: true, imgSrc: null, sku:1, amount: 100},
        7: {category: 3, name: "Vault of Gold", description: "+ $500", price: 49.99, isPremium: true, imgSrc: null, sku:2, amount: 500},
        8: {category: 3, name: "Bill Gates", description: "+ $1500", price: 99.99, isPremium: true, imgSrc: null, sku:3, amount: 1500},
        9: {category: 2, name: "Fire Extinguisher", description: "No more Fire (One Use)", price: 3, isPremium: false, imgSrc: null},
        10: {category: 2, name: "Weather Forecast", description: "No more thunder (One Use)", price: 1, isPremium: false, imgSrc: null},
        11: {cateogry: 2, name: "Backup Water", description: "No more drought (One Use)", price: 5, isPremium: false, imgSrc: null},
      },
      inventory: {},
      slideIndex: 0,
      dialogOpen: false,
      itemToBePurchased: null,
      snackbarOpen: false,
      snackbarMessage: ""
    }
  }

  componentDidMount() {
    auth.onAuthStateChanged(user => {
      if (user) {
        db.ref('farm').child(user.uid).limitToLast(1).on('value', snap => {
          console.log("snap.val():", snap.val());
          this.setState({
            user: {
              totalEarning: snap.val() === null ? -1 : Object.values(snap.val())[0].totalEarning
            }
          });
        });

        db.ref('inventories').child(user.uid).on('value', snap => {
          console.log("snap.val():", snap.val());
          this.setState({
            inventory: snap.val() === null ? {} : snap.val()
          });
        });
      }
    });
  }

  componentWillUnmount() {}

  handleChange = value => {
    this.setState({
      slideIndex: value
    });
  };

  handleDialogOpen = k => {
    this.setState({
      dialogOpen: true,
      itemToBePurchased: k
    });
  }

  handleDialogClose = () => {
    this.setState({
      dialogOpen: false,
      itemToBePurchased: null
    });
  }

  handleSnackbarClose = () => {
    this.setState({
      snackbarOpen: false
    });
  }

  handlePurchase = () => {
    const k = this.state.itemToBePurchased;
    if (this.state.shop[k].isPremium) {
      this.handlePremiumPurchase();
    }
    else {
      this.handleNonPremiumPurchase();
    }
  }

  handleNonPremiumPurchase = () => {
    const k = this.state.itemToBePurchased;
    const newTotalEarning = this.state.user.totalEarning - this.state.shop[k].price;
    var my_date;
    var self = this;
    if (newTotalEarning < 0) {
      this.setState({
        snackbarOpen: true,
        snackbarMessage: "Insufficient funds to purchase item!"
      });   
    }
    else {
      auth.onAuthStateChanged(user => {
        if (user) {
          db.ref('farm').child(user.uid).orderByChild('day').limitToLast(1).once('value', (snapshot) => {
            if (snapshot.val() == null){
              my_date = this.getTodaysDate();
            }else {
              snapshot.forEach((childSnapshot) => {
                my_date = childSnapshot.val().date;
              });
            }
          }).then( function () {
            db.ref('farm').child(user.uid).child(my_date).update({
              totalEarning: newTotalEarning
            }).then(db.ref('inventories').child(user.uid).push(k).then(() => {
              self.setState({
                snackbarOpen: true,
                snackbarMessage: "Item purchased!"
              });
              self.handleDialogClose();
            }), err => {
              self.setState({
                snackbarOpen: true,
                snackbarMessage: "Unable to purchase item due to server problems. Please try again."
              });
            });
          });
        }
      });
    }
  }
  
  handlePremiumPurchase = () => {
    const k = this.state.itemToBePurchased;
    const sku = this.state.shop[k].sku;

    console.log("google.payments.inapp.buy", sku);
    
    google.payments.inapp.buy({
      parameters: {'env': "prod"},
      'sku': sku,
      'success': this.onPurchase.bind(this),
      'failure': this.onPurchaseFail.bind(this)
    });
  }

  onPurchase = () =>{
    console.log("Purchase success");

    const k = this.state.itemToBePurchased;

    const newTotalEarning = this.state.user.totalEarning + this.state.shop[k].amount;

    auth.onAuthStateChanged(user => {
      if (user) {
        db.ref('farm').child(user.uid).child(this.getTodaysDate()).update({
          totalEarning: newTotalEarning
        }).then(() => {
          this.setState({
            snackbarOpen: true,
            snackbarMessage: this.state.shop[k].name + " purchased!"
          });
          this.handleConsume();
        })
      }
    });
  }

  onPurchaseFail = () => {
    console.log("Purchase failed");

    this.setState({
      snackbarOpen: true,
      snackbarMessage: "Unable to complete the purchase. Please try again."
    });    
    this.handleDialogClose();
  }

  handleConsume = () => {
    const k = this.state.itemToBePurchased;
    const sku = this.state.shop[k].sku;
    
    console.log("google.payments.inapp.consumePurchase", sku);

    google.payments.inapp.consumePurchase({
      'parameters': {'env': 'prod'},
      'sku': sku,
      'success': this.onConsume.bind(this),
      'failure': this.onConsumeFail.bind(this)
    });
  }

  onConsume = () => {
    console.log("Consumption completed");

    this.handleDialogClose();

  }

  onConsumeFail = () => {
    console.log("Consumption failed");

    this.handleDialogClose();
  }

  getTodaysDate = () => {
    const d = new Date();
  
    const YYYY = d.getFullYear();
    let MM = d.getMonth() + 1;
    let DD = d.getDate();
  
    if (MM < 10) MM = '0' + MM;
    if (DD < 10) DD = '0' + DD;
  
    return YYYY + "-" + MM + "-" + DD;
  }

  render() {
    console.log("this.state:", this.state);

    const tabStyle = {
      backgroundColor: "#8BC34A"
    }

    const actions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onClick={this.handleDialogClose}
      />,
      <FlatButton
        label="Buy it"
        primary={true}
        onClick={this.handlePurchase}
        autoFocus
      />,
    ];

    return (
      <div id="shop">
        <Toolbar>
          <ToolbarGroup>
            <ToolbarTitle text="Shop" />
          </ToolbarGroup>
          <ToolbarGroup>
            <ToolbarTitle 
              text={
                <span>You have: <FontAwesomeIcon icon={faMoneyBillAlt} /> {this.state.user.totalEarning.toFixed(2)}</span>
              } 
            />
          </ToolbarGroup>
        </Toolbar>

        <Tabs
          onChange={this.handleChange}
          value={this.state.slideIndex}
        >
          <Tab 
            label="Infrastructure" 
            value={0} 
            icon={<FontAwesomeIcon icon={faSeedling} />}
            style={tabStyle}
          />
          <Tab 
            label="Background" 
            value={1} 
            icon={<FontAwesomeIcon icon={faSun} />}
            style={tabStyle}
          />
          <Tab
            label="Disaster Relief" 
            value={2} 
            icon={<FontAwesomeIcon icon={faFire} />}
            style={tabStyle}
          />
          <Tab
            label="Add Funds" 
            value={3} 
            icon={<FontAwesomeIcon icon={faMoneyBillAlt} />}
            style={tabStyle}
          />
        </Tabs>
        <SwipeableViews
          index={this.state.slideIndex}
          onChangeIndex={this.handleChange}
        >
          <ShopPanel category={0} 
            shop={this.state.shop} inventory={this.state.inventory} handleDialogOpen={this.handleDialogOpen} 
          />
          <ShopPanel category={1} 
            shop={this.state.shop} inventory={this.state.inventory} handleDialogOpen={this.handleDialogOpen}
          />
          <ShopPanel category={2} 
            shop={this.state.shop} inventory={this.state.inventory} handleDialogOpen={this.handleDialogOpen}
          />
          <ShopPanel category={3} 
            shop={this.state.shop} inventory={this.state.inventory} handleDialogOpen={this.handleDialogOpen}
          />
        </SwipeableViews>

        <Dialog
          title={this.state.itemToBePurchased == null ? "" : this.state.shop[this.state.itemToBePurchased].name}
          actions={actions}
          modal={false}
          open={this.state.dialogOpen}
          onRequestClose={this.handleDialogClose}
        >
          Are you sure you want to buy and use this item?
        </Dialog>

        <Snackbar
          open={this.state.snackbarOpen}
          message={this.state.snackbarMessage}
          autoHideDuration={4000}
          onRequestClose={this.handleSnackbarClose}
        />
      </div>
    );
  }
}

export default Shop;