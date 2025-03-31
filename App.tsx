// App.tsx
import React, { useRef } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import CameraScreen from "./components/CameraScreen";
import HomeScreen from "./components/HomeScreen";
import SearchScreen from "./components/SearchScreen";
import SettingsScreen from "./components/SettingsScreen";
import EditScreen from "./components/EditScreen";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DropdownMenu from "./components/DropdownMenu";

// Define your route types
export type RootStackParamList = {
  Back: undefined;
  EditScreen: { imageId: number };
  Home: undefined;
  Camera: undefined;
  Search: undefined;
  Settings: undefined;
};

const DB_NAME = "database.db";
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

const deleteDbOnFirstLaunch = async () => {
  try {
    const firstLaunch = await AsyncStorage.getItem("isFirstLaunch");
    if (firstLaunch === null) {
      const dbExists = await FileSystem.getInfoAsync(DB_PATH);
      if (dbExists.exists) {
        await FileSystem.deleteAsync(DB_PATH);
        console.log("Database deleted on first launch.");
      }
      await AsyncStorage.setItem("isFirstLaunch", "true");
    }
  } catch (error) {
    console.error("Error checking first launch:", error);
  }
};

deleteDbOnFirstLaunch();

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();
const Tabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: "home" | "camera" | "search" | "settings" = "home";
        if (route.name === "Home") iconName = "home";
        if (route.name === "Camera") iconName = "camera";
        if (route.name === "Search") iconName = "search";
        if (route.name === "Settings") iconName = "settings";
        return (
          <Ionicons
            name={iconName}
            size={size}
            color={focused ? color : "gray"}
          />
        );
      },
      tabBarStyle: { height: 60 },
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={() => ({ headerShown: false, unmountOnBlur: true, })}
    />
    <Tab.Screen
      name="Camera"
      component={CameraScreen}
      options={() => ({ headerShown: false, unmountOnBlur: true, })}
    />
    <Tab.Screen
      name="Search"
      component={SearchScreen}
      options={() => ({ headerShown: false, unmountOnBlur: true, })}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={() => ({
        unmountOnBlur: true,
        headerShown: true, // Show the header for HomeScreen
        headerTitleAlign: "center",
        headerRight: () => <DropdownMenu/>,
      })}
    />
  </Tab.Navigator>
);

// Root Stack Navigator wrapping the Tabs and the shared EditScreen
const RootStack = createStackNavigator<RootStackParamList>();

const App = () => {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  return (
    <PaperProvider>
      <NavigationContainer ref={navigationRef}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootStack.Navigator>
            <RootStack.Screen
              name="Back"
              component={Tabs}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="EditScreen"
              component={EditScreen}
              options={{
                headerTitleAlign: "center",
              }}
            />
          </RootStack.Navigator>
        </GestureHandlerRootView>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
