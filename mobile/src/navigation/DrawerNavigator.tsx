import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Home,
  Map,
  History,
  Heart,
  Users,
  Settings,
  Wallet,
  Shield,
  LayoutDashboard,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { UserTabParamList, AdminStackParamList } from '../types';
import { colors } from '../styles/theme';

// Import screens (will be created next)
import DashboardScreen from '../screens/user/DashboardScreen';
import MapScreen from '../screens/user/MapScreen';
import HistoryScreen from '../screens/user/HistoryScreen';
import HelperModeScreen from '../screens/user/HelperModeScreen';
import ContactsScreen from '../screens/user/ContactsScreen';
import WalletScreen from '../screens/user/WalletScreen';
import SettingsScreen from '../screens/user/SettingsScreen';
import ServiceDashboardScreen from '../screens/service/ServiceDashboardScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import HelpersViewScreen from '../screens/admin/HelpersViewScreen';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator<UserTabParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

// User Tab Navigator (for regular users)
const UserTabNavigator: React.FC = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.dark[900],
          borderTopColor: colors.dark[800],
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.dark[400],
        headerStyle: {
          backgroundColor: colors.dark[900],
          borderBottomColor: colors.dark[800],
          borderBottomWidth: 1,
        },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          title: 'Home',
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      {user?.is_helper && (
        <Tab.Screen
          name="Helper"
          component={HelperModeScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
          }}
        />
      )}
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Admin Stack Navigator
const AdminStackNavigator: React.FC = () => {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.dark[900],
        },
        headerTintColor: '#fff',
      }}
    >
      <AdminStack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Admin Dashboard' }}
      />
      <AdminStack.Screen
        name="HelpersView"
        component={HelpersViewScreen}
        options={{ title: 'Service Providers' }}
      />
    </AdminStack.Navigator>
  );
};

// Main Drawer Navigator (route based on role)
const DrawerNavigator: React.FC = () => {
  const { user, isAdmin, isHospital, isFire, isNGO, isPolice } = useAuth();

  const isServiceProvider = isHospital || isFire || isNGO || isPolice;

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.dark[900],
        },
        drawerActiveTintColor: colors.primary[500],
        drawerInactiveTintColor: colors.dark[400],
      }}
    >
      {isAdmin ? (
        <Drawer.Screen
          name="AdminPanel"
          component={AdminStackNavigator}
          options={{
            drawerIcon: ({ color, size }) => <Shield color={color} size={size} />,
            title: 'Admin Panel',
          }}
        />
      ) : isServiceProvider ? (
        <Drawer.Screen
          name="ServiceDashboard"
          component={ServiceDashboardScreen}
          options={{
            drawerIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
            title: 'Dashboard',
          }}
        />
      ) : (
        <Drawer.Screen
          name="UserTabs"
          component={UserTabNavigator}
          options={{
            drawerIcon: ({ color, size }) => <Home color={color} size={size} />,
            title: 'SafeNow',
          }}
        />
      )}
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
