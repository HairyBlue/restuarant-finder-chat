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

function help() {
  echo "Usage:"
  echo "./ci.sh --all"
  echo "./ci.sh --all --clean   #remove node_modules and do ci"
  echo "./ci.sh <folder-name>"
  echo "./ci.sh <folder-name> --clean"
  exit 0
}

function ci_project() {
   project_path="$1"
   clean="$2"

   if [ ! "$project_path" ]; then
      exitf "No project path give or it may not reachable"
   fi

   cd "$project_path"
   print_info "**********$project_path**********"

   if [ "$clean" == "--clean" ]; then
      rm -rf "node_modules" || exit "Failed to clean"
   fi

   npm install || exit "Failed to npm install"
   npm run lint || echo "Unable to lint check"
   npm run format || echo "Unable to format"
   npm run build || exit "Failed to build"
   # npm run test || exit "Failed to test"

   cd "$current_dir"
}

if [ "$1" == "--help" ]; then
   help
fi

if [ "$#" -eq 0 ]; then
   exitf "Do --help"
elif [ "$1" == "--all" ]; then
   ci_project "./app/service" "$2"
   ci_project "./app/ui/vite-project" "$2"
else
   ls "$1" || exit "No such file or directory $1. Do --help"
   ci_project "$1" "$2"
fi