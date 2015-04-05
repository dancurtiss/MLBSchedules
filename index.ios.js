'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  NavigatorIOS
} = React;

var TeamList = require('./TeamList');

var MLBSchedules = React.createClass({
    render: function() {
    return (
      <NavigatorIOS
        style={styles.container}
        initialRoute={{
          title: 'MLB Schedules',
          component: TeamList,
        }}/>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
});

AppRegistry.registerComponent('MLBSchedules', () => MLBSchedules);
module.exports = MLBSchedules;