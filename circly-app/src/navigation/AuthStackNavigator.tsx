import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import EmailLoginScreen from '../screens/auth/EmailLoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import AccountMigrationScreen from '../screens/auth/AccountMigrationScreen';

export type AuthStackParamList = {
  Login: undefined;
  EmailLogin: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  AccountMigration: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          title: '디바이스 로그인',
        }}
      />
      <Stack.Screen 
        name="EmailLogin" 
        component={EmailLoginScreen}
        options={{
          title: '이메일 로그인',
          headerShown: true,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          title: '회원가입',
          headerShown: true,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{
          title: '비밀번호 찾기',
          headerShown: true,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="AccountMigration" 
        component={AccountMigrationScreen}
        options={{
          title: '계정 업그레이드',
          headerShown: true,
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}