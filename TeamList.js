'use strict';

var React = require('react-native');
var {
  ActivityIndicatorIOS,
  ListView,
  StyleSheet,
  Text,
  TextInput,
  View,
} = React;

var TeamScreen = require('./TeamScreen');
var TeamCell = require('./TeamCell');

var fetch = require('fetch');

var API_URL = 'https://erikberg.com/mlb/teams.json';
var API_KEYS = [
  '7waqfqbprs7pajbz28mqf6vz',
];

var resultsCache = {
  dataForQuery: {},
  nextPageNumberForQuery: {},
  totalForQuery: {},
};

var LOADING = {};

var TeamList = React.createClass({
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

  componentDidMount: function() {
    this.listTeams('');
  },

  listTeams: function(query: string) {
    this.timeoutID = null;

    this.setState({filter: query});

    var cachedResultsForQuery = resultsCache.dataForQuery[query];
    if (cachedResultsForQuery) {
      if (!LOADING[query]) {
        this.setState({
          dataSource: this.getDataSource(cachedResultsForQuery),
          isLoading: false
        });
      } else {
        this.setState({isLoading: true});
      }
      return;
    }

    LOADING[query] = true;
    resultsCache.dataForQuery[query] = null;
    this.setState({
      isLoading: true,
      queryNumber: this.state.queryNumber + 1,
      isLoadingTail: false,
    });

    fetch(API_URL)
      .then((response) => response.json())
      .catch((error) => {
        LOADING[query] = false;
        resultsCache.dataForQuery[query] = undefined;

        this.setState({
          dataSource: this.getDataSource([]),
          isLoading: false,
        });
      })
      .then((responseData) => {
        LOADING[query] = false;
        if (!responseData){
          console.log('no data dummy');
        }
        resultsCache.totalForQuery[query] = responseData.length;
        resultsCache.dataForQuery[query] = responseData;
        resultsCache.nextPageNumberForQuery[query] = 2;

        if (this.state.filter !== query) {
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

  getDataSource: function(teams: Array<any>): ListView.DataSource {
    return this.state.dataSource.cloneWithRows(teams);
  },

  selectTeam: function(team: Object) {
    this.props.navigator.push({
      title: team.full_name,
      component: TeamScreen,
      passProps: {team},
    });
  },

  onSearchChange: function(event: Object) {
    var filter = event.nativeEvent.text.toLowerCase();

    this.clearTimeout(this.timeoutID);
    this.timeoutID = this.setTimeout(() => this.searchTeams(filter), 100);
  },

  renderFooter: function() {
    if (!this.hasMore() || !this.state.isLoadingTail) {
      return <View style={styles.scrollSpinner} />;
    }
    return <ActivityIndicatorIOS style={styles.scrollSpinner} />;
  },

  renderRow: function(team: Object)  {
    return (
      <TeamCell
        onSelect={() => this.selectTeam(team)}
        team={team}
      />
    );
  },

  render: function() {
    var content = this.state.dataSource.getRowCount() === 0 ?
      <NoTeams
        filter={this.state.filter}
        isLoading={this.state.isLoading}
      /> :
      <ListView
        ref="listview"
        dataSource={this.state.dataSource}
        renderFooter={this.renderFooter}
        renderRow={this.renderRow}
        onEndReached={this.onEndReached}
        automaticallyAdjustContentInsets={false}
        keyboardDismissMode="onDrag"
        keyboardShouldPersistTaps={true}
        showsVerticalScrollIndicator={false}
      />;

    return (
      <View style={styles.container}>
        <SearchBar
          onSearchChange={this.onSearchChange}
          isLoading={this.state.isLoading}
          onFocus={() => this.refs.listview.getScrollResponder().scrollTo(0, 0)}
        />
        <View style={styles.separator} />
        {content}
      </View>
    );
  },
});

var NoTeams = React.createClass({
  render: function() {
    var text = '';
    if (this.props.filter) {
      text = `No results for “${this.props.filter}”`;
    } else if (!this.props.isLoading) {
      text = 'No teams found';
    }

    return (
      <View style={[styles.container, styles.centerText]}>
        <Text style={styles.noTeamsText}>{text}</Text>
      </View>
    );
  }
});

var SearchBar = React.createClass({
  render: function() {
    return (
      <View style={styles.searchBar}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChange={this.props.onSearchChange}
          placeholder="Search a team..."
          onFocus={this.props.onFocus}
          style={styles.searchBarInput}
        />
        <ActivityIndicatorIOS
          animating={this.props.isLoading}
          style={styles.spinner}
        />
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  centerText: {
    alignItems: 'center',
  },
  noTeamsText: {
    marginTop: 80,
    color: '#888888',
  },
  searchBar: {
    marginTop: 64,
    padding: 3,
    paddingLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBarInput: {
    fontSize: 15,
    flex: 1,
    height: 30,
  },
  separator: {
    height: 1,
    backgroundColor: '#eeeeee',
  },
  spinner: {
    width: 30,
  },
  scrollSpinner: {
    marginVertical: 20,
  },
});

module.exports = TeamList;
