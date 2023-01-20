import React, { Component } from 'react';
import { SafeAreaView, FlatList } from 'react-native';
import { shape, func } from 'prop-types';
import { ListItem, Avatar } from 'react-native-elements';
import { connect } from 'react-redux';
import { loadUsers } from 'app/actions/chat/actions';
import EmptyState from 'app/components/common/EmptyState';
import styles from './styles';

const getUsers = ({ users, mainUserId }) =>
  users ? [...Object.values(users)].filter(({ id }) => id !== mainUserId) : [];

class Users extends Component {
  componentDidMount() {
    this.props.loadUsers();
  }

  keyExtractor = (_, index) => `user-${index}`;

  renderItem = ({ item }) => {
    return (
      <ListItem key={item?.id} bottomDivider onPress={() => this.props.goToMessage({ id: item.id, name: item.name })}>
        <Avatar rounded source={{uri: item.avatar}} />
        <ListItem.Content>
          <ListItem.Title>{item.name}</ListItem.Title>
        </ListItem.Content>
      </ListItem>
    )
  }

  render() {
    const { users, user } = this.props;
    const userList = getUsers({ users, mainUserId: user.uid });
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState list={userList} />
        <FlatList
          keyExtractor={this.keyExtractor}
          data={userList}
          renderItem={this.renderItem} />
      </SafeAreaView>
    );
  }
}

Users.defaultProps = {
  users: []
};

Users.propTypes = {
  loadUsers: func.isRequired,
  goToMessage: func.isRequired,
  users: shape({}),
  user: shape({}).isRequired
};

const mapStateToProps = ({ sessionReducer, chatReducer }) => ({
  user: sessionReducer.user,
  users: chatReducer.users
});

const mapDispatchToProps = {
  loadUsers
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Users);
