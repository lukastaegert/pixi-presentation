#!/usr/bin/env bash

CURRENT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd ${CURRENT_PATH}

NUMBER_OF_DEPENDENCIES=$(npm list --depth=0 2>/dev/null  | grep "UNMET DEPENDENCY" | wc -l)
NUMBER_OF_DEPENDENCIES=${NUMBER_OF_DEPENDENCIES##*( )}

if [ "${NUMBER_OF_DEPENDENCIES}" -ne "0" ]; then
    npm install	> /dev/null
fi

npm start