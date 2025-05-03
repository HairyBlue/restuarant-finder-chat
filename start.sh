#!/bin/bash
set -e
current_dir="$(pwd)"

function print_error() {
    printf "\033[1;31m%s\033[0m" "$1"
}

function print_info() {
    printf "\033[1;32m%s\033[0m\n" "$1"
}

function exitf() {
    print_error "$1"
    exit 1
}

function cp_ui_to_service() {
   if [ ! -d "./app/service/dist/public" ]; then
      mkdir ./app/service/dist/public
   fi

   cp  -r  "./app/ui/vite-project/build/client" "./app/service/dist/public" || exitf "unable to copy folder ./app/ui/vite-project/build/client/ => ./app/service/dist/public"
}


if [ "$1" == "svc" ]; then
   cp_ui_to_service
   cd "./app/service/dist"
   node app.js || exitf "Unable to start sevice"
elif [ "$1" == "svc-dev" ]; then
   cd "./app/service"
   npm run dev || exitf "Unable to start sevice"
elif [ "$1" == "ui-dev" ]; then
   cd "./app/ui/vite-project"
   npm run dev || exitf "Unable to start sevice"
else 
   exitf "Please see start.sh"
fi