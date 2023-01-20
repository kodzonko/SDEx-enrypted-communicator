import React, { Component } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { func, bool, string } from 'prop-types';
import styles from './styles';

class BasicFormContainer extends Component {
  state = { name: '', email: '', password: '' };

  handleNameChange = name => this.setState({ name });

  handleEmailChange = email => this.setState({ email });

  handlePasswordChange = password => this.setState({ password });

  handleButtonPress = () => {
    this.props.onButtonPress({
      name: this.state.name,
      email: this.state.email,
      password: this.state.password
    });
  };

  render() {
    const { name, email, password } = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          {this.props.isSignUp && (
            <TextInput
              key="key-0"
              style={styles.textInput}
              placeholder="Name"
              returnKeyType="next"
              autoCapitalize="words"
              onChangeText={this.handleNameChange}
              value={name}
              underlineColorAndroid="transparent"
            />
          )}

          <TextInput
            key="key-1"
            style={styles.textInput}
            placeholder="Email"
            returnKeyType="next"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={this.handleEmailChange}
            value={email}
            underlineColorAndroid="transparent"
          />

          <TextInput
            key="key-2"
            style={styles.textInput}
            placeholder="Password"
            secureTextEntry
            returnKeyType="done"
            onChangeText={this.handlePasswordChange}
            value={password}
            underlineColorAndroid="transparent"
          />

          <TouchableOpacity style={styles.button} onPress={this.handleButtonPress}>
            <Text style={styles.title}>{this.props.title}</Text>
          </TouchableOpacity>

          {!this.props.isSignUp && (
            <TouchableOpacity style={styles.signUpButton} onPress={this.props.onSignUpButtonOPress}>
              <Text style={styles.title}>Create Account</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
}

BasicFormContainer.defaultProps = {
  isSignUp: false,
  onSignUpButtonOPress: () => {}
};

BasicFormContainer.propTypes = {
  onButtonPress: func.isRequired,
  isSignUp: bool,
  title: string.isRequired,
  onSignUpButtonOPress: func
};

export default BasicFormContainer;
