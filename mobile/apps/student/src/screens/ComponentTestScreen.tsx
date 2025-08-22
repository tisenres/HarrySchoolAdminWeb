/**
 * Component Test Screen - Show REAL Working Components
 * Based on International Student App Screenshots
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';

// Import our REAL working components
import Button from '../../../../packages/ui/components/Button/Button';
import Card from '../../../../packages/ui/components/Card/Card';
import Input from '../../../../packages/ui/components/Input/Input';

export default function ComponentTestScreen() {
  const [inputValue, setInputValue] = useState('');
  const [inputWithError, setInputWithError] = useState('');

  const handleButtonPress = () => {
    Alert.alert('Button Pressed!', 'The button animation and press worked correctly!');
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Component Test Screen</Text>
          <Text style={styles.subtitle}>REAL Working Components from Screenshots</Text>
        </View>

        {/* Button Tests */}
        <Card variant="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Button Component</Text>
          <Text style={styles.description}>
            Green background (#1d7452), white text, rounded corners (12px), press animation (scales to 0.95)
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Primary Button"
              onPress={handleButtonPress}
              variant="primary"
              size="medium"
            />
            
            <Button
              title="Secondary Button"
              onPress={handleButtonPress}
              variant="secondary"
              size="medium"
            />
            
            <Button
              title="Gold Button"
              onPress={handleButtonPress}
              variant="gold"
              size="medium"
            />
            
            <Button
              title="Ghost Button"
              onPress={handleButtonPress}
              variant="ghost"
              size="medium"
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Small Button"
              onPress={handleButtonPress}
              variant="primary"
              size="small"
            />
            
            <Button
              title="Large Button"
              onPress={handleButtonPress}
              variant="primary"
              size="large"
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Loading..."
              onPress={handleButtonPress}
              variant="primary"
              loading={true}
            />
            
            <Button
              title="Disabled"
              onPress={handleButtonPress}
              variant="primary"
              disabled={true}
            />
          </View>
        </Card>

        {/* Card Tests */}
        <Card variant="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Card Component</Text>
          <Text style={styles.description}>
            Shadow (elevation: 4 on Android, shadowOpacity: 0.1 on iOS), padding: 16px, rounded corners: 16px
          </Text>
          
          <Card variant="light" style={styles.innerCard}>
            <Text style={styles.cardContent}>Light Card Variant</Text>
            <Text style={styles.cardSubtext}>White background with shadow</Text>
          </Card>
          
          <Card variant="dark" style={styles.innerCard}>
            <Text style={styles.cardContentWhite}>Dark Card Variant</Text>
            <Text style={styles.cardSubtextWhite}>Dark background (#2d2d2d) with shadow</Text>
          </Card>
        </Card>

        {/* Input Tests */}
        <Card variant="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Input Component</Text>
          <Text style={styles.description}>
            Gray border (#E5E5E5), floating label animation, focus state with green border (#1d7452), error state with red border
          </Text>
          
          <View style={styles.inputContainer}>
            <Input
              label="Email Address"
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Input
              label="Password"
              value={inputWithError}
              onChangeText={setInputWithError}
              secureTextEntry
              error={inputWithError && !validateEmail(inputWithError) ? 'Please enter a valid email address' : undefined}
            />
            
            <Input
              label="Disabled Input"
              value="Cannot edit this"
              disabled={true}
            />
          </View>
        </Card>

        {/* Combined Example - Real Use Case */}
        <Card variant="dark" style={styles.section}>
          <Text style={styles.sectionTitle}>Real Use Case Example</Text>
          <Text style={styles.description}>
            Login form using all three components together
          </Text>
          
          <View style={styles.formContainer}>
            <Input
              label="Username"
              value=""
              onChangeText={() => {}}
              autoCapitalize="none"
            />
            
            <Input
              label="Password"
              value=""
              onChangeText={() => {}}
              secureTextEntry
            />
            
            <Button
              title="Log In"
              onPress={() => Alert.alert('Success!', 'All components working together!')}
              variant="primary"
              size="large"
              style={styles.loginButton}
            />
          </View>
        </Card>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a', // Dark background from screenshots
  },
  
  scrollView: {
    flex: 1,
  },
  
  content: {
    padding: 16,
  },
  
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  
  section: {
    marginBottom: 24,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  
  description: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 16,
    lineHeight: 20,
  },
  
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  
  innerCard: {
    marginBottom: 12,
  },
  
  cardContent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  
  cardSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  cardContentWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  
  cardSubtextWhite: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  
  inputContainer: {
    gap: 16,
  },
  
  formContainer: {
    gap: 16,
  },
  
  loginButton: {
    marginTop: 8,
  },
  
  bottomSpacer: {
    height: 40,
  },
});