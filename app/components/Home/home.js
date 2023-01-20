import React, { Component } from 'react';
import { SafeAreaView, View, Button, Text } from 'react-native';
import propTypes from 'prop-types';
import { connect } from 'react-redux';
import { logoutUser } from 'app/actions/session/actions';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles';

class Home extends Component {
  handleSignOut = async () => {
    await this.props.logout();
    this.props.onSignOut();
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.marginBox}>
            <Button onPress={this.handleSignOut} title="Logout" />
          </View>

          <Text style={styles.title}>React Native Redux Firebase Chat</Text>          

          <View style={styles.marginBox}>
            <Icon name="logo-github" size={40} />
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

Home.propTypes = {
  logout: propTypes.func.isRequired,
  onSignOut: propTypes.func.isRequired
};

const mapDispatchToProps = {
  logout: logoutUser
};

export default connect(
  null,
  mapDispatchToProps
)(Home);
