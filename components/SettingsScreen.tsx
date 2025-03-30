import React, { useState, useEffect } from "react";
import { View, Text, Switch, TextInput, StyleSheet, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SettingsScreen = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const darkModeValue = await AsyncStorage.getItem("darkMode");
      const notificationsValue = await AsyncStorage.getItem("notifications");
      const usernameValue = await AsyncStorage.getItem("username");
      
      if (darkModeValue !== null) setDarkMode(JSON.parse(darkModeValue));
      if (notificationsValue !== null) setNotifications(JSON.parse(notificationsValue));
      if (usernameValue !== null) setUsername(usernameValue);
    } catch (error) {
      console.error("Failed to load settings", error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem("darkMode", JSON.stringify(darkMode));
      await AsyncStorage.setItem("notifications", JSON.stringify(notifications));
      await AsyncStorage.setItem("username", username);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Dark Mode</Text>
      <Switch value={darkMode} onValueChange={(value) => setDarkMode(value)} />
      
      <Text style={styles.label}>Silent Camera Shutter</Text>
      <Switch value={notifications} onValueChange={(value) => setNotifications(value)} />
      
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username"
      />
      
      <Button title="Save Settings" onPress={saveSettings} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 18,
    marginVertical: 10,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
});

export default SettingsScreen;
