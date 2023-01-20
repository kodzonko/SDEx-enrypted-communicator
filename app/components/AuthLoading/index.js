import React from 'react';
import { View } from 'react-native';
import Proptypes from 'prop-types';
import { connect } from 'react-redux';
import { restoreSession } from 'app/actions/session/actions';
import CustomActivityIndicator from 'app/components/common/CustomActivityIndicator';
import styles from './styles';

class AuthLoadingContainer extends React.Component {
  componentDidMount() {
    this.props.restoreSession();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.logged && this.props.logged) {
      this.props.onSignedIn();
    } else {
      this.props.onSignedOut();
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <CustomActivityIndicator color="#ffffff" size="large" />
      </View>
    );
  }
}

AuthLoadingContainer.propTypes = {
  logged: Proptypes.bool.isRequired,
  restoreSession: Proptypes.func.isRequired,
  onSignedIn: Proptypes.func.isRequired,
  onSignedOut: Proptypes.func.isRequired
};

const mapStateToProps = ({ sessionReducer: { loading, logged } }) => ({
  loading,
  logged
});

const mapDispatchToProps = {
  restoreSession
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AuthLoadingContainer);
