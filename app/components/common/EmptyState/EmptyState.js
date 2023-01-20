import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import propTypes from 'prop-types';

const EmptyState = ({ list }) =>
  list && !list.length ? (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: 'white',
          justifyContent: 'center',
          alignItems: 'center',
          bottom: 50
        }
      ]}
    >
      <Image
        source={{ uri: 'https://i.stack.imgur.com/qLdPt.png' }}
        style={{
          ...StyleSheet.absoluteFillObject,
          resizeMode: 'contain'
        }}
      />
    </View>
  ) : null;

EmptyState.propTypes = {
  list: propTypes.arrayOf(propTypes.shape({})).isRequired
};

export default EmptyState;
