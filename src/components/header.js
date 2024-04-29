// Component Header
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export const Header = () => {
  const backgroundStyle = {
    backgroundColor: '#212121',
    color: '#fff'
  };

  return (
    <View style={[styles.container, backgroundStyle]}>
      <Text style={[styles.title, backgroundStyle]}>Cubbie Webserver</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 20,
    display: 'flex'
  },
  title: {
    fontWeight: '700',
    paddingLeft: 6,
    fontSize: 22,
    fontFamily: 'Avenir-Heavy'
  },
  image: {
    width: 100,
    height: 100
  }
});
