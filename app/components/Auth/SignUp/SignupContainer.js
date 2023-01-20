import React, { Component } from 'react';
import { View, Image } from 'react-native';
import { func, bool } from 'prop-types';
import { connect } from 'react-redux';
import { signupUser } from 'app/actions/session/actions';
import CustomActivityIndicator from 'app/components/common/CustomActivityIndicator';
import KeyboardAwareScrollView from 'app/components/common/KeyboardAwareScrollView';
import BasicFormContainer from '../BasicForm/basicForm';
import styles from '../BasicForm/styles';

const FIREBASE_LOGO = require('app/icons/firebase.png');

class SignupContainer extends Component {
  componentDidUpdate(prevProps) {
    if (!prevProps.registered && this.props.registered) this.props.onSignedIn();
  }

  handleSignUp = params => this.props.signupUser(params);

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
            <BasicFormContainer title="Create Account" onButtonPress={this.handleSignUp} isSignUp />
          )}
        </View>
      </KeyboardAwareScrollView>
    );
  }
}

SignupContainer.defaultProps = {
  registered: false
};

SignupContainer.propTypes = {
  registered: bool,
  onSignedIn: func.isRequired,
  loading: bool.isRequired,
  signupUser: func.isRequired
};

const mapStateToProps = ({ sessionReducer: { loading, registered } }) => ({
  loading,
  registered
});

const mapDispatchToProps = {
  signupUser
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SignupContainer);
