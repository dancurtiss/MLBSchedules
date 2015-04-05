'use strict';

var React = require('react-native');
var {
  Image,
  PixelRatio,
  ScrollView,
  StyleSheet,
  ListView,
  Text,
  View,
} = React;

var ScheduleCell = require('./ScheduleCell');

var API_URL = 'https://erikberg.com/mlb/results/';

///sport/results/team_id.format

var resultsCache = {
  dataForQuery: {},
  nextPageNumberForQuery: {},
  totalForQuery: {},
};

var LOADING = {};


var TeamScreen = React.createClass({
  getInitialState: function() {
    return {
      isLoading: false,
      isLoadingTail: false,
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      filter: '',
      queryNumber: 0,
    };
  },
  render: function() {
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.mainSection}>
          <View style={styles.rightPane}>
            <Text style={styles.teamTitle}>{this.props.team.full_name}</Text>
            <Text>{this.props.team.conference}</Text>
          </View>
        </View>
        <View style={styles.separator} />
        <Text>
          {this.props.team.city}, {this.props.team.state}
        </Text>
        <View style={styles.separator} />
        <ListView
          ref="listview"
          dataSource={this.state.dataSource}
          renderFooter={this.renderFooter}
          renderRow={this.renderRow}
          onEndReached={this.onEndReached}
          automaticallyAdjustContentInsets={false}
          keyboardDismissMode="onDrag"
          keyboardShouldPersistTaps={true}
          showsVerticalScrollIndicator={false} />
      </ScrollView>
    );
  },
  componentDidMount: function() {
    this.listSchedule(this.props.team.team_id);
  },
  listSchedule: function(teamId: string) {
    this.timeoutID = null;

    this.setState({filter: teamId});

    var cachedResultsForQuery = resultsCache.dataForQuery[teamId];
    if (cachedResultsForQuery) {
      if (!LOADING[teamId]) {
        this.setState({
          dataSource: this.getDataSource(cachedResultsForQuery),
          isLoading: false
        });
      } else {
        this.setState({isLoading: true});
      }
      return;
    }

    LOADING[teamId] = true;
    resultsCache.dataForQuery[teamId] = null;
    this.setState({
      isLoading: true,
      queryNumber: this.state.queryNumber + 1,
      isLoadingTail: false,
    });

    var scheduleAPI = API_URL + teamId + '.json';
    fetch(scheduleAPI)
      .then((response) => response.json())
      .catch((error) => {
        LOADING[teamId] = false;
        resultsCache.dataForQuery[teamId] = undefined;

        this.setState({
          dataSource: this.getDataSource([]),
          isLoading: false,
        });
      })
      .then((responseData) => {
        LOADING[teamId] = false;
        if (!responseData){
          console.log('no data dummy');
        }
        resultsCache.totalForQuery[teamId] = responseData.length;
        resultsCache.dataForQuery[teamId] = responseData;
        resultsCache.nextPageNumberForQuery[teamId] = 2;

        if (this.state.filter !== teamId) {
          // do not update state if the query is stale
          return;
        }

        this.setState({
          isLoading: false,
          dataSource: this.getDataSource(responseData),
        });
      })
      .done();
  },
  hasMore: function(): boolean {
    return false;
  },

  onEndReached: function() {

  },

  getDataSource: function(results: Array<any>): ListView.DataSource {
    return this.state.dataSource.cloneWithRows(results);
  },

  selectResult: function(result: Object) {
    console.log('result selected: ' + result.event_id)
    // this.props.navigator.push({
    //   title: team.full_name,
    //   component: TeamScreen,
    //   passProps: {team},
    // });
  },
  renderFooter: function() {
    if (!this.hasMore() || !this.state.isLoadingTail) {
      return <View style={styles.scrollSpinner} />;
    }
    return <ActivityIndicatorIOS style={styles.scrollSpinner} />;
  },

  renderRow: function(result: Object)  {
    console.log(result);
    return (
      <ScheduleCell
        onSelect={() => this.selectResult(event_id)}
        result={result} />
    );
  },

});

var styles = StyleSheet.create({
  contentContainer: {
    padding: 10,
  },
  rightPane: {
    justifyContent: 'space-between',
    flex: 1,
  },
  teamTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  rating: {
    marginTop: 10,
  },
  mainSection: {
    flexDirection: 'row',
  },
  detailsImage: {
    width: 134,
    height: 200,
    backgroundColor: '#eaeaea',
    marginRight: 10,
  },
  separator: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    height: 1 / PixelRatio.get(),
    marginVertical: 10,
  },
});


module.exports = TeamScreen;
