#!/bin/bash

normal=$'\e[0m'
green=$(tput setaf 2)
check="${green}✔${normal}"

# Fix react-native-video duplicated with same name.
cd node_modules/react-native-gifted-chat/node_modules/ && rm -rf react-native-video
echo "${check} Successful removed 'react-native-video' from 'react-native-gifted-chat'"