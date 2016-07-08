#!/usr/bin/env bash

CURRENT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
node ${CURRENT_PATH}/src/server/server.js