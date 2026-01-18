import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import IntroScreen from './screens/IntroScreen';
import LanguageScreen from './screens/LanguageScreen';
import ChildFormScreen from './screens/ChildFormScreen';
import MainMenuScreen from './screens/MainMenuScreen';
import StoryLibraryScreen from './screens/StoryLibraryScreen';
import StoryReaderScreen from './screens/StoryReaderScreen';
import GamesListScreen from './screens/GamesListScreen';
import ChargeGemsScreen from './screens/ChargeGemsScreen';
import ChargeCoinsScreen from './screens/ChargeCoinsScreen';

// استيراد ألعاب يويا (تأكد من وجود الملفات من 1 إلى 20)
import YoyaGameV1 from './screens/YoyaGameV1';
import YoyaGameV2 from './screens/YoyaGameV2';
import YoyaGameV3 from './screens/YoyaGameV3';
import YoyaGameV4 from './screens/YoyaGameV4';
import YoyaGameV5 from './screens/YoyaGameV5';
import YoyaGameV6 from './screens/YoyaGameV6';
import YoyaGameV7 from './screens/YoyaGameV7';
import YoyaGameV8 from './screens/YoyaGameV8';
import YoyaGameV9 from './screens/YoyaGameV9';
import YoyaGameV10 from './screens/YoyaGameV10';
import YoyaGameV11 from './screens/YoyaGameV11';
import YoyaGameV12 from './screens/YoyaGameV12';
import YoyaGameV13 from './screens/YoyaGameV13';
import YoyaGameV14 from './screens/YoyaGameV14';
import YoyaGameV15 from './screens/YoyaGameV15';
import YoyaGameV16 from './screens/YoyaGameV16';
import YoyaGameV17 from './screens/YoyaGameV17';
import YoyaGameV18 from './screens/YoyaGameV18';
import YoyaGameV19 from './screens/YoyaGameV19';
import YoyaGameV20 from './screens/YoyaGameV20';

// استيراد الألعاب الجديدة التي أنشأناها
import ExplorationGame2D from './screens/ExplorationGame2D';
import SimpleExplorationGame from './screens/SimpleExplorationGame';
import PlatformerGame from './screens/PlatformerGame';

// إضافة لعبة WorldExplorerGame الجديدة
import WorldExplorerGame from './screens/WorldExplorerGame';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="ChildForm" component={ChildFormScreen} />
        <Stack.Screen name="MainMenu" component={MainMenuScreen} />
        <Stack.Screen name="StoryLibrary" component={StoryLibraryScreen} />
        <Stack.Screen name="StoryReader" component={StoryReaderScreen} />
        <Stack.Screen name="GamesList" component={GamesListScreen} />
        <Stack.Screen name="ChargeGems" component={ChargeGemsScreen} />
        <Stack.Screen name="ChargeCoins" component={ChargeCoinsScreen} />

        {/* تسجيل جميع ألعاب يويا */}
        <Stack.Screen name="YoyaGameV1" component={YoyaGameV1} />
        <Stack.Screen name="YoyaGameV2" component={YoyaGameV2} />
        <Stack.Screen name="YoyaGameV3" component={YoyaGameV3} />
        <Stack.Screen name="YoyaGameV4" component={YoyaGameV4} />
        <Stack.Screen name="YoyaGameV5" component={YoyaGameV5} />
        <Stack.Screen name="YoyaGameV6" component={YoyaGameV6} />
        <Stack.Screen name="YoyaGameV7" component={YoyaGameV7} />
        <Stack.Screen name="YoyaGameV8" component={YoyaGameV8} />
        <Stack.Screen name="YoyaGameV9" component={YoyaGameV9} />
        <Stack.Screen name="YoyaGameV10" component={YoyaGameV10} />
        <Stack.Screen name="YoyaGameV11" component={YoyaGameV11} />
        <Stack.Screen name="YoyaGameV12" component={YoyaGameV12} />
        <Stack.Screen name="YoyaGameV13" component={YoyaGameV13} />
        <Stack.Screen name="YoyaGameV14" component={YoyaGameV14} />
        <Stack.Screen name="YoyaGameV15" component={YoyaGameV15} />
        <Stack.Screen name="YoyaGameV16" component={YoyaGameV16} />
        <Stack.Screen name="YoyaGameV17" component={YoyaGameV17} />
        <Stack.Screen name="YoyaGameV18" component={YoyaGameV18} />
        <Stack.Screen name="YoyaGameV19" component={YoyaGameV19} />
        <Stack.Screen name="YoyaGameV20" component={YoyaGameV20} />

        {/* الألعاب الجديدة */}
        <Stack.Screen name="ExplorationGame2D" component={ExplorationGame2D} />
        <Stack.Screen name="SimpleExplorationGame" component={SimpleExplorationGame} />
        <Stack.Screen name="PlatformerGame" component={PlatformerGame} />
        
        {/* لعبة WorldExplorerGame الجديدة */}
        <Stack.Screen name="WorldExplorerGame" component={WorldExplorerGame} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
