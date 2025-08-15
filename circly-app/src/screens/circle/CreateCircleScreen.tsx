import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CreateCircleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Circle</Text>
      <Text style={styles.subtitle}>
        This screen will allow users to create new circles.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});