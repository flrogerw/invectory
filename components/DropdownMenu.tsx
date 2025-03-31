// DropdownMenu.tsx
import React, { useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { Menu, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_NAME = 'database.db';
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;


const DropdownMenu: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

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

  useFocusEffect(
    React.useCallback(() => {
      setVisible(false);
    }, [])
  );

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <TouchableOpacity
          onPress={() => setVisible(true)}
          style={{ marginRight: 15 }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
      }
    >
      <Menu.Item onPress={() => navigation.navigate("Home")} title="Copy Database" />
      <Divider />
      <Menu.Item title="Copy Images" />
      <Divider />
      <Menu.Item
        onPress={() => {
          setVisible(false);
          Alert.alert(
            "Delete Database",
            "Are you sure you want to delete the database? This action cannot be undone.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: deleteDatabase },
            ]
          );
        }}
        title="Delete Database"
        titleStyle={{ color: 'red' }}
      />
    </Menu>
  );
};

export default DropdownMenu;
