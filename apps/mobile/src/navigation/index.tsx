import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { ChatDetailScreen } from '../screens/chat/ChatDetailScreen';
import { TicketListScreen } from '../screens/tickets/TicketListScreen';
import { TicketDetailScreen } from '../screens/tickets/TicketDetailScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { useAuthStore } from '../store/auth-store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Tickets" component={TicketListScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function Navigation() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
