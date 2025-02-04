import React, { useState } from 'react';
import MainScreen from './MainScreen';

const App = () => {
  const [username, setUsername] = useState('');

  return (
    <MainScreen username={username} setUsername={setUsername} />
  );
};

export default App;