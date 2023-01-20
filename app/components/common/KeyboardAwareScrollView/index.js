import React from 'react';
import { node } from 'prop-types';
import { KeyboardAwareScrollView as KeyboardAScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './styles';

const KeyboardAwareScrollView = ({ children, ...props }) => (
  <KeyboardAScrollView
    style={styles.container}
    keyboardShouldPersistTaps="handled"
    contentInsetAdjustmentBehavior="automatic"
    {...props}
  >
    {children}
  </KeyboardAScrollView>
);

KeyboardAwareScrollView.propTypes = {
  children: node.isRequired
};

export default KeyboardAwareScrollView;
