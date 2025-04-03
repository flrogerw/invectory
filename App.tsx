// App.tsx
import React, { useRef } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
//import { Ionicons } from "@expo/vector-icons";
import CameraScreen from "./components/CameraScreen";
import HomeScreen from "./components/HomeScreen";
import SearchScreen from "./components/ImageSearchScreen";
import SettingsScreen from "./components/SettingsScreen";
import EditScreen from "./components/EditScreen";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DropdownMenu from "./components/DropdownMenu";

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Define your route types
export type RootStackParamList = {
  Back: undefined;
  EditScreen: { imageId: number };
  Collection: undefined;
  Add: undefined;
  Text: undefined;
  Image: undefined;
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
        let iconName: "collections" | "add-a-photo" | "image-search" | "manage-search" | "settings" = "collections";
        if (route.name === "Collection") iconName = "collections";
        if (route.name === "Add") iconName = "add-a-photo";
        if (route.name === "Image") iconName = "image-search";
        if (route.name === "Text") iconName = "manage-search";
        if (route.name === "Settings") iconName = "settings";
        return (
          <MaterialIcons
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
      name="Collection"
      component={HomeScreen}
      options={() => ({ headerShown: true, unmountOnBlur: true, })}
    />
    <Tab.Screen
      name="Add"
      component={CameraScreen}
      options={() => ({ headerShown: true, unmountOnBlur: true, })}
    />
    <Tab.Screen
      name="Image"
      component={SearchScreen}
      options={() => ({ headerShown: true, unmountOnBlur: true, })}
    />
    <Tab.Screen
      name="Text"
      component={SearchScreen}
      options={() => ({ headerShown: true, unmountOnBlur: true, })}
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
