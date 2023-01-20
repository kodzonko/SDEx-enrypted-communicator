import React, { Component } from 'react';
import { View, Image, Alert } from 'react-native';
import { func, bool } from 'prop-types';
import { connect } from 'react-redux';
import { loginUser, restoreSession } from 'app/actions/session/actions';
import CustomActivityIndicator from 'app/components/common/CustomActivityIndicator';
import KeyboardAwareScrollView from 'app/components/common/KeyboardAwareScrollView';
import BasicFormComponent from '../BasicForm/basicForm';
import styles from '../BasicForm/styles';

const FIREBASE_LOGO = require('app/icons/firebase.png');

class SingInContainer extends Component {
  componentDidMount() {
    this.props.restoreSession();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.logged && this.props.logged) {
      this.props.onSignedIn();
    }

    if (!prevProps.error && this.props.error) {
      Alert.alert(null, this.props.error);
    }
  }

  handleSignIn = params => {
    this.props.loginUser(params);
  }

  render() {
    return (
      <KeyboardAwareScrollView>
        <View style={styles.imageBox}>
          <Image style={styles.image} source={FIREBASE_LOGO} />
        </View>
        <View style={styles.loginBox}>
          {this.props.loading ? (
            <CustomActivityIndicator color="#ffffff" size="large" />
          ) : (
            <React.Fragment>
              <BasicFormComponent
                title="Sign In"
                onButtonPress={this.handleSignIn}
                onSignUpButtonOPress={this.props.onSignUp}
              />
            </React.Fragment>
          )}
        </View>
      </KeyboardAwareScrollView>
    );
  }
}

SingInContainer.propTypes = {
  restoreSession: func.isRequired,
  logged: bool.isRequired,
  loading: bool.isRequired,
  onSignedIn: func.isRequired,
  onSignUp: func.isRequired,
  loginUser: func.isRequired
};

const mapStateToProps = ({ sessionReducer: { loading, user, error, logged } }) => ({
  loading,
  user,
  error,
  logged
});

const mapDispatchToProps = {
  loginUser,
  restoreSession
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SingInContainer);
