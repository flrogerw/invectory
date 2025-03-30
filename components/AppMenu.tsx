import { View, Text, TouchableOpacity } from "react-native";
import { Menu, MenuOptions, MenuOption, MenuTrigger } from "react-native-popup-menu";
import { Entypo } from "@expo/vector-icons"; 

const AppMenu = () => {
  return (
    <Menu>
      <MenuTrigger>
        <Entypo name="dots-three-vertical" size={24} color="black" style={{ marginRight: 15 }} />
      </MenuTrigger>
      <MenuOptions>
        <MenuOption onSelect={() => alert("Settings Clicked")}>
          <Text style={{ padding: 10 }}>Settings</Text>
        </MenuOption>
        <MenuOption onSelect={() => alert("Help Clicked")}>
          <Text style={{ padding: 10 }}>Help</Text>
        </MenuOption>
      </MenuOptions>
    </Menu>
  );
};

export default AppMenu;
