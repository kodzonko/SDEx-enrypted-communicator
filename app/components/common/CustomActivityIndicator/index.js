import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { string } from 'prop-types';
import styles from './styles';

const CustomActivityIndicator = ({ size, color }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator style={styles.container} size={size} color={color} />
  </View>
);

CustomActivityIndicator.propTypes = {
  size: string.isRequired,
  color: string.isRequired
};

export default CustomActivityIndicator;
