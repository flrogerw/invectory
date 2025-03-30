import React, { useEffect, useRef, useState } from "react";
import { createStackNavigator, StackNavigationProp } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, NavigationContainerRef, useNavigationContainerRef } from "@react-navigation/native";
import { Menu, Divider, Provider as PaperProvider } from "react-native-paper";
import { Alert, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CameraScreen from "./components/CameraScreen";
import HomeScreen from "./components/HomeScreen";
import SearchScreen from "./components/SearchScreen";
import SettingsScreen from "./components/SettingsScreen";
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EditScreen from "./components/EditScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";


const DB_NAME = 'database.db';
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

let iconName: "home" | "camera" | "search" | "settings"; // Define valid icon names here


const deleteDatabase = async () => {
  try {
    // Check if the database exists
    const dbExists = await FileSystem.getInfoAsync(DB_PATH);

    if (dbExists.exists) {
      await FileSystem.deleteAsync(DB_PATH);
      await AsyncStorage.removeItem('isFirstLaunch'); // Reset first launch flag
      Alert.alert("Success", "Database deleted successfully. Restart the app to take effect.");
    } else {
      Alert.alert("Info", "Database does not exist.");
    }
  } catch (error) {
    console.error("Error deleting database:", error);
    Alert.alert("Error", "Failed to delete the database.");
  }
};

const deleteDbOnFirstLaunch = async () => {
  try {
    const firstLaunch = await AsyncStorage.getItem('isFirstLaunch');

    if (firstLaunch === null) {
      const dbExists = await FileSystem.getInfoAsync(DB_PATH);
      if (dbExists.exists) {
        await FileSystem.deleteAsync(DB_PATH);
        console.log('Database deleted on first launch.');
      }
      await AsyncStorage.setItem('isFirstLaunch', 'true');
    }
  } catch (error) {
    console.error('Error checking first launch:', error);
  }
};

deleteDbOnFirstLaunch();

// Define the navigation types
export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Search: undefined;
  Settings: undefined;
  ViewAll: undefined;
  EditScreen: { imageId: number };
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Stack Navigator
const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={({ navigation }) => ({
        unmountOnBlur: true,
        headerLeft: () => null,
        headerRight: () => <DropdownMenu navigation={navigation} />,
        headerTitleAlign: "center",
      })}
    />
    <Stack.Screen
      name="Camera"
      component={CameraScreen}
      options={({ navigation }) => ({
        unmountOnBlur: true,
        headerLeft: () => null,
        headerRight: () => <DropdownMenu navigation={navigation} />,
        headerTitleAlign: "center",
      })}
    />
    <Stack.Screen
      name="Search"
      component={SearchScreen}
      options={({ navigation }) => ({
        unmountOnBlur: true,
        headerLeft: () => null,
        headerRight: () => <DropdownMenu navigation={navigation} />,
        headerTitleAlign: "center",
      })}
    />
    <Stack.Screen
      name="Settings"
      component={SettingsScreen}
      options={({ navigation }) => ({
        unmountOnBlur: true,
        headerLeft: () => null,
        headerRight: () => <DropdownMenu navigation={navigation} />,
        headerTitleAlign: "center",
      })}
    />
    <Stack.Screen 
      name="EditScreen" 
      component={EditScreen}
      options={({ navigation }) => ({
        unmountOnBlur: true,
        headerLeft: () => null,
        headerRight: () => <DropdownMenu navigation={navigation} />,
        headerTitleAlign: "center",
      })} />
    
  </Stack.Navigator>
);

// Bottom Tab Navigator
const App = () => {
  const [viewMode, setViewMode] = useState("camera"); // Default mode
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    if (navigationRef.current?.isReady()) {
      setIsNavigationReady(true);
    }
  }, []);

  useEffect(() => {
    // Ensure viewMode updates are in sync with the tab changes
  }, [viewMode]);

  return (
    <PaperProvider>
      <NavigationContainer ref={navigationRef} onReady={() => setIsNavigationReady(true)}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: "home" | "camera" | "search" | "settings" = "home";

              if (route.name === "Main") iconName = "home";
              if (route.name === "Search") iconName = "search";
              if (route.name === "Settings") iconName = "settings";
              if (route.name === "Add") iconName = "camera";

              const iconColor = focused ? color : "gray"; // Active tab gets color, inactive gets gray

              return <Ionicons name={iconName} size={size} color={iconColor} />;
            },
            tabBarStyle: { height: 60 },
          })}
        >
          <Tab.Screen
            name="Main"
            component={MainStack}
            options={{ headerShown: false }}
          />

          <Tab.Screen
            name="Add"
            component={CameraScreen} // Use CameraScreen for Add and Search
          />

          <Tab.Screen
            name="Search"
            component={SearchScreen}
          />

          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
        </GestureHandlerRootView>
      </NavigationContainer>
    </PaperProvider>
  );
};

// Dropdown Menu
type DropdownMenuProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({ navigation }) => {
  const [visible, setVisible] = useState(false);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <TouchableOpacity onPress={() => setVisible(true)} style={{ marginRight: 15 }}>
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
      }
    >
      <Menu.Item onPress={() => navigation.navigate("Home")} title="Copy Database" />
      <Divider />
      <Menu.Item onPress={() => navigation.navigate("ViewAll")} title="View Collection" />
      <Divider />
      <Menu.Item
        onPress={() => {
          setVisible(false);
          Alert.alert(
            "Delete Database",
            "Are you sure you want to delete the database? This action cannot be undone.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: deleteDatabase }
            ]
          );
        }}
        title="Delete Database"
        titleStyle={{ color: 'red' }} // Highlight delete option in red
      />
    </Menu>
  );
};

export default App;
