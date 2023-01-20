import React, { Component } from 'react';
import { SafeAreaView, View } from 'react-native';
import Proptypes from 'prop-types';
import { connect } from 'react-redux';
import { GiftedChat } from 'react-native-gifted-chat';
import { sendMessage, loadMessages } from 'app/actions/chat/actions';
import EmptyState from 'app/components/common/EmptyState';
import CustomActivityIndicator from 'app/components/common/CustomActivityIndicator';
import { sendPushNotification, getUser } from 'app/api';
import styles from './styles';

const getMessages = ({ messages }) => (messages ? [...Object.values(messages)].reverse() : []);

class Chat extends Component {
  state = {
    inputText: '',
    messages: [],
    receptorData: {}
  };

  componentDidMount() {
    const { navigation = {} } = this.props;
    const { id: receptorId } = navigation.state.params;
    this.fetchReceptorData({ receptorId });
    this.props.loadMessages({ mainId: this.props.user.uid, receptorId });
  }

  onSend(messages = []) {
    const { receptorData, inputText } = this.state;
    const { user } = this.props;

    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, messages)
    }));

    this.props.sendMessage({
      message: inputText,
      user,
      receptorData
    });

    sendPushNotification({
      message: inputText,
      deviceToken: receptorData.deviceToken,
      deviceType: receptorData.deviceType,
      displayName: user.displayName,
      avatar: user.photoURL,
      id: user.uid
    });
  }

  fetchReceptorData = async ({ receptorId }) => {
    const result = await getUser(receptorId);
    this.setState({ receptorData: result });
  };

  handleInputTextChanged = text => this.setState({ inputText: text });

  render() {
    const messagesList = getMessages({ messages: this.props.messages });
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState list={messagesList} />
        {this.props.loading && (
          <View style={styles.loading}>
            <CustomActivityIndicator color="#2299ec" size="large" />
          </View>
        )}
        <GiftedChat
          text={this.state.inputText}
          onInputTextChanged={text => this.handleInputTextChanged(text)}
          messages={messagesList}
          onSend={messages => this.onSend(messages)}
          showUserAvatar
          isAnimated
          user={{
            _id: this.props.user.uid
          }}
          parsePatterns={linkStyle => [
            {
              pattern: /#(\w+)/,
              style: { ...linkStyle, color: 'lightgreen' }
            }
          ]}
        />
      </SafeAreaView>
    );
  }
}

Chat.defaultProps = {
  messages: []
};

Chat.propTypes = {
  user: Proptypes.shape({
    uid: Proptypes.string.isRequired
  }).isRequired,
  navigation: Proptypes.shape({}).isRequired,
  loadMessages: Proptypes.func.isRequired,
  sendMessage: Proptypes.func.isRequired,
  messages: Proptypes.shape({}),
  loading: Proptypes.bool.isRequired
};

const mapStateToProps = ({ sessionReducer: { user }, chatReducer: { messages, loading } }) => ({
  user,
  messages,
  loading
});

const mapDispatchToProps = {
  sendMessage,
  loadMessages
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Chat);
